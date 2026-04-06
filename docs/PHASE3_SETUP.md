# Phase 3: AI Pipeline Setup

## Prerequisites

- Phase 1 & 2 complete (Auth, DB, Webhook)
- OpenAI API key
- pgvector enabled in Supabase (migration `006_repo_context.sql` runs `CREATE EXTENSION IF NOT EXISTS vector`)

## Environment variables

Add to `.env.local`:

```
OPENAI_API_KEY=sk-...
```

No additional env vars are needed for the RAG pipeline — it reuses the existing GitHub App token and Supabase service role key.

## Database migration

Run `supabase/migrations/006_repo_context.sql` in the Supabase SQL Editor **before** connecting any repos. It:

- Enables the `vector` extension (pgvector)
- Adds `repo_summary TEXT` to the `projects` table
- Creates the `repo_file_chunks` table with `embedding vector(1536)`, `start_line`, `end_line`, `content_sha`, and IVFFlat index

## Connect a repo

1. Go to **Dashboard** → **Connect a repo**
2. Select a repo from the list (requires the GitHub App to be installed)
3. Click **Connect**

On connect, Commitly fires a `github/repo.connected` Inngest event that triggers the **full repo index** (`index-repo` function):

- Fetches the recursive file tree from GitHub (up to 150 source files)
- Splits each file into function/class-level chunks with line-range metadata
- Embeds all chunks via `text-embedding-3-small` and stores them in `repo_file_chunks`
- Summarizes the `README.md` with GPT and stores the result in `projects.repo_summary`

This runs in the background. Expect it to take 30–90 seconds for a typical repo.

## Pipeline overview (GitHub Push → Draft)

```
GitHub push webhook
  → fetch-diffs               (get patch text per commit)
  → check-significance        ← EARLY EXIT for ~60-70% of pushes (typos, configs, refactors)
  → [fire github/repo.files-changed → update-embeddings runs in background]
  → retrieve-context          (4-level fallback per changed file)
  → explain-commits           (GPT: changed function chunks + related chunks + repo_summary)
  → get-user / check-usage-limit / fetch-brand-examples
  → generate-content          (GPT: changelog / LinkedIn / Twitter with explanation context)
  → create-draft              (stores commit_explanations in ai_content JSONB)
  → send-email
```

### retrieve-context — 4-level fallback

For each changed file (up to 3 per commit), `getFileContext()` tries in order:

1. **Line-range chunk query** — parse `@@` hunk headers from the diff, query `repo_file_chunks` for chunks whose `start_line`/`end_line` overlaps the changed lines. Returns exact function chunks. Free, precise.
2. **Full file fetch from GitHub API** — fallback for new or unindexed files. Caps at 2000 chars.
3. **Diff text only** — always available, zero API cost.
4. **Empty** — caller uses commit message only.

Deleted files (`status === 'removed'`) skip all levels and call `handleDeletedFile()` instead, which removes their stale chunks from the vector store.

### Incremental embedding update

After each significant push, `update-embeddings` (triggered via `github/repo.files-changed`) re-indexes only the files touched by the push:

- Deleted files → `deleteChunksForFile()` (no embedding)
- Modified/added files → SHA-based cache check → skip if content unchanged; otherwise re-chunk, re-embed, upsert
- If `README.md` changed → re-run GPT summarization, update `projects.repo_summary`

## Run Inngest (local dev)

Inngest processes the AI pipeline in the background. Run it alongside Next.js:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npx inngest-cli@latest dev
```

Then open http://localhost:8288 to see Inngest's dev UI. You should see three registered functions:
- `process-push` — main push-to-draft pipeline
- `index-repo` — full repo indexing on connect
- `update-embeddings` — incremental re-index on push

## Test the pipeline

1. Run migration `006_repo_context.sql` in Supabase SQL Editor
2. Connect your repo in the dashboard — watch `index-repo` run in the Inngest UI
3. Ensure webhook is configured (see `docs/GITHUB_WEBHOOK_SETUP.md`)
4. Push a significant commit (e.g. "Add user authentication")
5. Check Inngest UI: `process-push` → `update-embeddings` should both run
6. Check Supabase `release_drafts` table — `ai_content` should include `commit_explanations`
7. Visit the review page — the "What changed — engineer's view" card should appear above the marketing copy

## What a draft now contains

The `ai_content` JSONB column stores:

```json
{
  "changelog": "...",
  "linkedin": "...",
  "twitter": ["...", "..."],
  "original_commits": [{ "id": "abc1234", "message": "..." }],
  "commit_explanations": [{ "sha": "abc1234", "explanation": "..." }]
}
```

`commit_explanations` is populated by the `explain-commits` step and rendered on the review page as the "What changed — engineer's view" card.
