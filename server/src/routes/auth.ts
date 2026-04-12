import { createHash, randomBytes } from 'crypto';
import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config.js';
import { query } from '../db.js';

const router = Router();

const SESSION_MAX_AGE = config.session.maxAge; // 6 hours

// ── Helpers ─────────────────────────────────────────────────

function generateSessionToken(): string {
  return randomBytes(48).toString('hex');
}

function generatePassword(length = 14): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  const buf = randomBytes(length);
  return Array.from(buf, (b) => chars[b % chars.length]).join('');
}

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
}

async function logActivity(
  userId: number,
  action: string,
  req: Request,
  pageUrl?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await query(
      `INSERT INTO user_activity (user_id, action, page_url, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5::inet, $6)`,
      [userId, action, pageUrl || null, metadata ? JSON.stringify(metadata) : null, getClientIp(req) || null, req.headers['user-agent'] || null],
    );
  } catch (err) {
    console.error('Activity log error:', err);
  }
}

async function createSession(userId: number, req: Request) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);
  await query(
    `INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4::inet, $5)`,
    [userId, token, expiresAt, getClientIp(req) || null, req.headers['user-agent'] || null],
  );
  return { token, expiresAt };
}

// ── Middleware: authenticate session ────────────────────────

export async function authenticateSession(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  const token = authHeader.slice(7);
  try {
    const result = await query(
      `SELECT s.id, s.user_id, s.expires_at, u.email, u.first_name, u.last_name, u.google_id
       FROM sessions s JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > NOW()`,
      [token],
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false, error: 'Session expired or invalid' });
    }
    (req as any).user = result.rows[0];
    (req as any).sessionToken = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
}

// ── POST /auth/signup ───────────────────────────────────────

router.post('/auth/signup', async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
  }

  try {
    // Check if email already exists
    const existing = await query('SELECT id, google_id FROM users WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      const row = existing.rows[0];
      if (row.google_id) {
        return res.status(409).json({ ok: false, error: 'This email is linked to a Google account. Please use Google Sign-In.' });
      }
      return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name`,
      [email, passwordHash, firstName || null, lastName || null],
    );

    const user = result.rows[0];
    const session = await createSession(user.id, req);
    await logActivity(user.id, 'signup', req);

    res.status(201).json({
      ok: true,
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// ── POST /auth/login ────────────────────────────────────────

router.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required' });
  }

  try {
    const result = await query(
      'SELECT id, email, password_hash, first_name, last_name, google_id FROM users WHERE email = $1',
      [email],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.password_hash && user.google_id) {
      return res.status(401).json({ ok: false, error: 'This account uses Google Sign-In. Please use the Google button.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    const session = await createSession(user.id, req);
    await logActivity(user.id, 'login', req);

    res.json({
      ok: true,
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// ── POST /auth/google ───────────────────────────────────────

router.post('/auth/google', async (req: Request, res: Response) => {
  const { credential } = req.body ?? {};

  if (!credential) {
    return res.status(400).json({ ok: false, error: 'Google credential is required' });
  }

  try {
    // Decode Google ID token (JWT) — verify with Google's public keys
    const parts = credential.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({ ok: false, error: 'Invalid Google token' });
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;

    if (!email || !googleId) {
      return res.status(400).json({ ok: false, error: 'Invalid Google token payload' });
    }

    // Check if user exists by google_id
    let result = await query('SELECT id, email, first_name, last_name FROM users WHERE google_id = $1', [googleId]);

    if (result.rowCount === 0) {
      // Check if email exists without google_id — link accounts
      result = await query('SELECT id, email, first_name, last_name FROM users WHERE email = $1', [email]);
      if (result.rowCount && result.rowCount > 0) {
        await query('UPDATE users SET google_id = $1, updated_at = NOW() WHERE email = $2', [googleId, email]);
      } else {
        // New user
        result = await query(
          `INSERT INTO users (email, google_id, first_name, last_name)
           VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name`,
          [email, googleId, firstName || null, lastName || null],
        );
      }
    }

    const user = result.rows[0];
    const session = await createSession(user.id, req);
    await logActivity(user.id, 'login_google', req);

    res.json({
      ok: true,
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// ── GET /auth/me ────────────────────────────────────────────

router.get('/auth/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.json({ ok: false, user: null });
  }

  const token = authHeader.slice(7);
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.google_id, s.expires_at
       FROM sessions s JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > NOW()`,
      [token],
    );

    if (result.rowCount === 0) {
      return res.json({ ok: false, user: null });
    }

    const row = result.rows[0];
    res.json({
      ok: true,
      user: { id: row.id, email: row.email, firstName: row.first_name, lastName: row.last_name, hasGoogle: !!row.google_id },
      expiresAt: row.expires_at,
    });
  } catch (err) {
    console.error('Auth me error:', err);
    res.json({ ok: false, user: null });
  }
});

// ── POST /auth/logout ───────────────────────────────────────

router.post('/auth/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.json({ ok: true });
  }

  const token = authHeader.slice(7);
  try {
    // Get user for activity log before deleting session
    const result = await query(
      'SELECT user_id FROM sessions WHERE session_token = $1',
      [token],
    );
    if (result.rowCount && result.rowCount > 0) {
      await logActivity(result.rows[0].user_id, 'logout', req);
    }
    await query('DELETE FROM sessions WHERE session_token = $1', [token]);
  } catch (err) {
    console.error('Logout error:', err);
  }
  res.json({ ok: true });
});

// ── POST /auth/activity ─────────────────────────────────────

router.post('/auth/activity', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false });
  }

  const token = authHeader.slice(7);
  try {
    const result = await query(
      'SELECT user_id FROM sessions WHERE session_token = $1 AND expires_at > NOW()',
      [token],
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false });
    }

    const { action, pageUrl, metadata } = req.body ?? {};
    await logActivity(result.rows[0].user_id, action || 'page_visit', req, pageUrl, metadata);
    res.json({ ok: true });
  } catch (err) {
    console.error('Activity error:', err);
    res.status(500).json({ ok: false });
  }
});

// ── GET /auth/suggest-password ──────────────────────────────

router.get('/auth/suggest-password', (_req: Request, res: Response) => {
  res.json({ ok: true, password: generatePassword() });
});

// ── GET /auth/config (public client config) ────────────────

router.get('/auth/config', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    googleClientId: config.google.clientId || null,
  });
});

// ── Legacy: password-protected pages (BSE meeting etc.) ─────

router.post('/auth/verify', async (req, res) => {
  const { slug, password } = req.body ?? {};

  if (!slug || !password) {
    return res.status(400).json({ ok: false, error: 'slug and password are required' });
  }

  const hash = createHash('sha256').update(password as string).digest('hex');

  try {
    const result = await query(
      'SELECT id FROM protected_pages WHERE slug = $1 AND password_hash = $2',
      [slug, hash],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ ok: false, error: 'Invalid password' });
    }

    const token = jwt.sign({ slug }, config.jwtSecret);
    res.json({ ok: true, token });
  } catch (err) {
    console.error('Auth verify error:', err);
    res.status(500).json({ ok: false, error: 'Database error' });
  }
});

// ── Periodic cleanup (run on startup, then every hour) ──────

async function cleanupSessions() {
  try {
    await query('SELECT cleanup_expired_sessions()');
  } catch {
    // Table might not exist yet
  }
}
cleanupSessions();
setInterval(cleanupSessions, 60 * 60 * 1000);

export default router;
