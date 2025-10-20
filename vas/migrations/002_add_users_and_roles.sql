-- PostgreSQL migration: add users table and seed basic admin/worker accounts
BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL, -- store bcrypt hash
  full_name text,
  role text NOT NULL DEFAULT 'worker', -- 'admin' | 'worker'
  email text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- NOTE: Replace sample password_hash values with real bcrypt hashes before production use.
INSERT INTO users (username, password_hash, full_name, role, email)
VALUES
  ('admin', '$2b$10$REPLACE_WITH_REAL_BCRYPT_HASH_FOR_ADMIN', 'System Admin', 'admin', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, full_name, role, email)
VALUES
  ('worker1', '$2b$10$REPLACE_WITH_REAL_BCRYPT_HASH_FOR_WORKER', 'Worker One', 'worker', 'worker1@example.com')
ON CONFLICT (username) DO NOTHING;

COMMIT;