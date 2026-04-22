-- Code graph: import graph, entry points, and centrality scores per project
-- Generated during repo indexing; powers architecture-aware prompts and ranking.
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE projects ADD COLUMN IF NOT EXISTS code_graph JSONB;
