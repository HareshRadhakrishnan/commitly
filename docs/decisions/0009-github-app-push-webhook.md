# ADR-0009: GitHub App with push webhook

## Status

Accepted (retroactive)

## Context

Commitly AI needs to:
- Discover user repositories (list what they can connect)
- Receive notifications when code is pushed
- Fetch commit details (diffs) for AI analysis

*Inferred from code as of 2026-03-23:* The codebase uses a GitHub App (not OAuth App) as evidenced by installation-based token generation in `src/lib/github/app.ts` and installation ID storage in `github_installations` table.

## Decision

Use a **GitHub App** with:
- **Permissions**: Repository Contents (read), Metadata (read)
- **Webhook event**: `push`
- **Webhook URL**: `/api/webhooks/github`
- **Installation flow**: User installs app → callback stores `installation_id` → app fetches repos via installation token

Store `installation_id` in `github_installations` table; link to projects via `projects.github_installation_id`.

## Consequences

**Positive:**
- Installation grants access to selected repos (user chooses scope)
- Higher rate limits than OAuth tokens
- Webhook per installation (no per-repo setup)
- Can fetch private repo contents

**Negative / Trade-offs:**
- More complex than OAuth App
- Must generate JWT + installation tokens for API calls
- Private key management required (`GITHUB_APP_PRIVATE_KEY`)

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| OAuth App + per-repo webhooks | User must configure webhook per repo; doesn't scale |
| GitHub Actions | Requires user to add workflow file; not zero-config |
| Polling for commits | Inefficient; webhooks are real-time |

## Relevant Files

- `src/lib/github/app.ts` — JWT generation, installation tokens, API calls
- `src/lib/github/webhook.ts` — signature verification, payload parsing
- `src/app/api/webhooks/github/route.ts` — webhook endpoint
- `src/app/dashboard/github/callback/page.tsx` — installation callback
- `src/app/api/github/repos/route.ts` — list installation repos
- `supabase/migrations/003_github_app_schema.sql` — `github_installations` table
- `docs/GITHUB_APP_SETUP.md` — setup instructions
