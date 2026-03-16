-- Commitly initial schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query

-- Users: synced from NextAuth on first sign-in
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects: GitHub repos linked to a user
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_repo_id BIGINT NOT NULL,
  repo_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, github_repo_id)
);

-- ReleaseDrafts: AI-generated content per project
CREATE TABLE release_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ai_content JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'published')),
  commit_shas TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_release_drafts_project_id ON release_drafts(project_id);
CREATE INDEX idx_release_drafts_status ON release_drafts(status);

-- RLS disabled for MVP: we use NextAuth + service_role for server-side access.
-- Authorization is enforced in application code via session checks.
