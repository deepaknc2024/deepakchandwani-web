import pg from 'pg';
import { config } from './config.js';

const pool = new pg.Pool(config.db);

export function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

export default pool;
