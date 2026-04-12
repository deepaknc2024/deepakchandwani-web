import { createHash } from 'crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';

const router = Router();

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

export default router;
