import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.post('/contact', async (req, res) => {
  const { first_name, last_name, email, subject, message } = req.body ?? {};

  if (!first_name || !email || !message) {
    return res.status(400).json({
      ok: false,
      error: 'first_name, email, and message are required',
    });
  }

  try {
    const result = await query(
      `INSERT INTO contacts (first_name, last_name, email, subject, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [first_name, last_name || null, email, subject || null, message],
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Contact insert error:', err);
    res.status(500).json({ ok: false, error: 'Database error' });
  }
});

export default router;
