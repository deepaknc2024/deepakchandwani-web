import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/health', async (_req, res) => {
  let dbOk = false;
  try {
    await query('SELECT 1');
    dbOk = true;
  } catch {
    // db unreachable
  }
  res.json({ status: 'ok', db: dbOk });
});

export default router;
