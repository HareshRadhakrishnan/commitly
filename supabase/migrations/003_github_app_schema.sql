-- Phase 2a: GitHub App installation & repo discovery
-- Run in Supabase SQL Editor

-- Store GitHub App installations per user (user can have multiple: personal + orgs)
CREATE TABLE github_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  installation_id BIGINT NOT NULL,
  account_login TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(installation_id)
);

CREATE INDEX idx_github_installations_user_id ON github_installations(user_id);

-- Add to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_installation_id BIGINT;
