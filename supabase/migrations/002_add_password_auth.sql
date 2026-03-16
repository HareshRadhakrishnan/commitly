-- Add password support for email/password (Credentials) auth
-- Run in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Users with password_hash are credential users (auth_id = 'cred|' || email)
-- OAuth users have password_hash = NULL
