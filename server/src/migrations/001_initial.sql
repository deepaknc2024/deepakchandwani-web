CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protected_pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed protected pages with SHA-256 hash of "bse2026"
INSERT INTO protected_pages (slug, password_hash)
VALUES
  ('bse-meeting', encode(digest('bse2026', 'sha256'), 'hex')),
  ('bse-design',  encode(digest('bse2026', 'sha256'), 'hex'))
ON CONFLICT (slug) DO NOTHING;
