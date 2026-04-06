-- RAG context pipeline: repo-level embeddings and summaries
-- Run in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Repo summary stored per project (generated from README on connect)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_summary TEXT;

-- Chunked file embeddings for each connected project
CREATE TABLE IF NOT EXISTS repo_file_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_sha TEXT NOT NULL,    -- SHA-256 hex of content; used to skip re-embedding unchanged chunks
  start_line INTEGER NOT NULL,  -- inclusive, 1-based; used for line-range overlap queries
  end_line INTEGER NOT NULL,    -- inclusive, 1-based
  embedding vector(1536),       -- text-embedding-3-small default dimensions
  indexed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, file_path, chunk_index)
);

-- Cosine similarity index for fast nearest-neighbour search
CREATE INDEX IF NOT EXISTS repo_file_chunks_embedding_idx
  ON repo_file_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Composite index for line-range queries and per-file operations
CREATE INDEX IF NOT EXISTS repo_file_chunks_project_file_idx
  ON repo_file_chunks (project_id, file_path);
