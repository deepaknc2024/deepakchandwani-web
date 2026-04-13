import { Router, type Request, type Response } from 'express';
import { config } from '../config.js';
import { query } from '../db.js';

const router = Router();

const MAX_ROWS = 200;

// DB schema context sent to the LLM so it can generate accurate SQL
const DB_SCHEMA = `
PostgreSQL database with these tables:

1. users (id SERIAL PK, email VARCHAR(255) UNIQUE, password_hash VARCHAR(255), google_id VARCHAR(255) UNIQUE, first_name VARCHAR(100), last_name VARCHAR(100), created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)

2. sessions (id SERIAL PK, user_id INTEGER FK->users.id, session_token VARCHAR(255) UNIQUE, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ, ip_address INET, user_agent TEXT)

3. user_activity (id SERIAL PK, user_id INTEGER FK->users.id, action VARCHAR(50) e.g. 'login','logout','login_google','signup','page_visit', page_url TEXT, metadata JSONB, ip_address INET, user_agent TEXT, created_at TIMESTAMPTZ)

4. contacts (id SERIAL PK, first_name VARCHAR(100), last_name VARCHAR(100), email VARCHAR(255), subject VARCHAR(255), message TEXT, created_at TIMESTAMPTZ)

5. protected_pages (id SERIAL PK, slug VARCHAR(100) UNIQUE, password_hash VARCHAR(255), created_at TIMESTAMPTZ)
`.trim();

// ── POST /admin/query ──────────────────────────────────────
// Accepts { message, history } — sends to OpenRouter LLM, gets SQL, executes it

router.post('/admin/query', async (req: Request, res: Response) => {
  const { message, history } = req.body ?? {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ ok: false, error: 'message is required' });
  }

  if (!config.openrouterApiKey) {
    return res.status(500).json({ ok: false, error: 'OpenRouter API key not configured' });
  }

  try {
    // Build conversation for the LLM
    const systemPrompt = `You are a SQL query generator for a PostgreSQL database. You help an admin understand user activity and site analytics.

${DB_SCHEMA}

Rules:
- ONLY generate SELECT queries. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or TRUNCATE.
- Always LIMIT results to ${MAX_ROWS} rows maximum.
- Return ONLY a JSON object with two fields: "sql" (the SQL query string) and "explanation" (a brief human-readable explanation of what the query does).
- If the user asks something that cannot be answered with a SELECT query, return: {"sql": null, "explanation": "I can only help with read-only queries about user activity and site data."}
- Use proper JOIN syntax when combining tables.
- Format timestamps in a human-readable way using to_char() where appropriate.
- For ambiguous requests, make reasonable assumptions and explain them in the explanation.`;

    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 exchanges max to limit context)
    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }

    messages.push({ role: 'user', content: message });

    // Call OpenRouter
    const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://web.deepakchandwani.com',
        'X-Title': 'DC Web Admin',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1-nano',
        messages,
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error('OpenRouter error:', llmRes.status, errText);
      return res.status(502).json({ ok: false, error: 'LLM service error' });
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices?.[0]?.message?.content || '';

    // Parse the LLM response — extract JSON from possible markdown code blocks
    let parsed: { sql: string | null; explanation: string };
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return res.json({
        ok: true,
        explanation: rawContent,
        sql: null,
        rows: [],
        columns: [],
      });
    }

    // Safety check: reject non-SELECT queries
    if (parsed.sql) {
      const normalized = parsed.sql.trim().toUpperCase();
      if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
        return res.json({
          ok: true,
          explanation: 'I can only run read-only (SELECT) queries for safety.',
          sql: null,
          rows: [],
          columns: [],
        });
      }

      // Ensure LIMIT exists
      if (!normalized.includes('LIMIT')) {
        parsed.sql = parsed.sql.replace(/;?\s*$/, ` LIMIT ${MAX_ROWS};`);
      }
    }

    // Execute the SQL
    if (!parsed.sql) {
      return res.json({
        ok: true,
        explanation: parsed.explanation || 'No query to run.',
        sql: null,
        rows: [],
        columns: [],
      });
    }

    const result = await query(parsed.sql);
    const columns = result.fields?.map((f) => f.name) || [];
    const rows = result.rows || [];

    res.json({
      ok: true,
      explanation: parsed.explanation,
      sql: parsed.sql,
      columns,
      rows: rows.slice(0, MAX_ROWS),
      rowCount: result.rowCount,
    });
  } catch (err: any) {
    console.error('Admin query error:', err);

    // If it's a SQL error, return it gracefully
    if (err.code && err.message) {
      return res.json({
        ok: true,
        explanation: `SQL error: ${err.message}`,
        sql: err.query || null,
        rows: [],
        columns: [],
        error: err.message,
      });
    }

    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// ── GET /admin/schema ──────────────────────────────────────
// Returns the DB schema for display in the admin UI

router.get('/admin/schema', (_req: Request, res: Response) => {
  res.json({ ok: true, schema: DB_SCHEMA });
});

export default router;
