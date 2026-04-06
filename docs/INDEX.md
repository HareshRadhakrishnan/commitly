# Commitly AI docs — intent index

**Goal:** Find the right doc by **what you need to do**, not by folder name.

Paths are **repo-root-relative** (e.g. `docs/STRIPE_SETUP.md`).

---

## Getting Started

| I need to… | Document | Notes |
|------------|----------|-------|
| Orient in the repo fast | `AGENTS.md` | Map, commands, task router |
| Copy the "right" pattern for code | `docs/canonical-examples.md` | One canonical file per pattern |
| Run database migrations | `supabase/README.md` | SQL Editor order `001`–`006` |
| Know what we're building (MVP) | `instructions.md` | PRD v1 |
| Know V2 scope (billing, repos, brand) | `instructionsV2.md` | PRD v2 |
| Learn a flow interactively | `.tours/README.md` | CodeTour walkthroughs |

---

## Understanding the System

| I need to… | Document | Notes |
|------------|----------|-------|
| Trace push → draft → email | `docs/PHASE3_SETUP.md`, `docs/PHASE4_SETUP.md` | AI + Inngest + RAG; Resend + review UI |
| Understand the RAG context pipeline | `docs/PHASE3_SETUP.md` | Repo indexing, chunk retrieval, explain-commits step |
| See full schema history | `supabase/migrations/*.sql` | Source of truth for tables |
| Understand why a decision was made | `docs/decisions/README.md` | ADR index with links |
| Walk through a specific flow | `.tours/*.tour` | Interactive code tours |
| Avoid silent breakages when changing schema/types | `.cursor/rules/blast-radius.mdc` | Couplings list |
| **Planned:** one-page pipeline walkthrough | `docs/push-to-draft-pipeline.md` | *Not created yet* |

---

## Setting Up & Configuring

| I need to… | Document | Notes |
|------------|----------|-------|
| Configure GitHub App + install URL | `docs/GITHUB_APP_SETUP.md` | Setup URL, callback, env vars |
| Point webhooks at the app (local/prod) | `docs/GITHUB_WEBHOOK_SETUP.md` | Secret, ngrok, push events |
| Enable AI generation + RAG indexing | `docs/PHASE3_SETUP.md` | `OPENAI_API_KEY`, migration 006, repo connect |
| Enable notification emails | `docs/PHASE4_SETUP.md` | Resend, `NEXT_PUBLIC_APP_URL` |
| Enable subscriptions | `docs/STRIPE_SETUP.md` | Checkout, portal, webhook events |
| Deploy and set production env | `docs/DEPLOYMENT.md` | Vercel + env table |
| **Planned:** all env vars in one place | `docs/ENV_REFERENCE.md` | *Not created yet* |
| **Planned:** Inngest dev + prod | `docs/INNGEST_SETUP.md` | *Not created yet* |

---

## Extending & Modifying

| I need to… | Document | Notes |
|------------|----------|-------|
| Add a page, API route, or server action | `AGENTS.md` → Task Router | Start file for each task type |
| Follow global conventions | `.cursor/rules/project-conventions.mdc` | Naming, DB, auth, Inngest |
| Follow UI/UX design spec | `.cursor/plans/Ui-design-spec.md` | Colors, components, layout, radius, dark mode |
| Change prompts or model output shape | `docs/canonical-examples.md` + `src/lib/ai/` | Blast radius: prompts ↔ JSON parse |
| Change the RAG chunking strategy | `src/lib/github/chunker.ts` | Update `BOUNDARY_PATTERNS`; re-run `index-repo` for all connected repos |
| Change context retrieval fallback logic | `src/lib/github/context.ts` | 4-level cascade: line-range → file fetch → diff → empty |
| Add a DB table or column | `supabase/migrations/` + `AGENTS.md` | New `00X_*.sql`; update `src/lib/db/` |
| Record a new architecture decision | `docs/decisions/README.md` | Copy TEMPLATE.md |
| **Planned:** contributor checklist | `docs/CONTRIBUTING.md` | *Not created yet* |

---

## Debugging & Troubleshooting

| I need to… | Document | Notes |
|------------|----------|-------|
| Fix "webhook not firing" / signature errors | `docs/GITHUB_WEBHOOK_SETUP.md` | Secret, URL, delivery tab |
| Fix Stripe events not updating tier | `docs/STRIPE_SETUP.md` | Stripe CLI forward, signing secret |
| Fix emails with wrong or broken links | `docs/PHASE4_SETUP.md` | `NEXT_PUBLIC_APP_URL` |
| Fix AI or Inngest not running | `docs/PHASE3_SETUP.md` | Keys, Inngest dev, function registration |
| Fix "no context" / generic explanations | `docs/PHASE3_SETUP.md` + `src/lib/github/context.ts` | Check migration 006 ran; check `repo_file_chunks` has rows; check `index-repo` completed |
| Fix "What changed" card not appearing | `src/app/dashboard/review/[logId]/page.tsx` + `ai_content.commit_explanations` | Only shown when `commit_explanations` array is non-empty in the draft |
| Avoid shipping a coupling bug | `.cursor/rules/blast-radius.mdc` | Pre-commit checklist |

---

## Operating & Monitoring

| I need to… | Document | Notes |
|------------|----------|-------|
| Know what must never be exposed client-side | `AGENTS.md` → Key Invariants | Service role, secrets |
| Redeploy with correct env | `docs/DEPLOYMENT.md` | Full variable list |
| **Planned:** runbook-style ops | `docs/RUNBOOK.md` | *Not created yet* — incidents, rollback, webhooks |

---

## Verify / Review / Document

| I need to… | Document | Notes |
|------------|----------|-------|
| Verify a change before committing | `docs/verification.md` | Commands + manual flows by task |
| Review a PR / self-review | `docs/review-protocol.md` | Checklists, blast-radius, invariants |
| Review common mistakes in this codebase | `AGENTS.md` → Common Mistakes | Table: Don't / Do / Why |
| Check if canonical examples are stale | `docs/canonical-examples.md` | Header + Relevant Files section |
| See documentation home by category | `docs/README.md` | Curated hub |

---

## Cross-reference: doc → primary intent

| Document | Primary intents |
|----------|-----------------|
| `AGENTS.md` | Orient, build, invariants, mistakes |
| `docs/README.md` | Browse by category |
| `docs/INDEX.md` | Find by "I need to…" |
| `docs/canonical-examples.md` | Copy patterns |
| `docs/verification.md` | Verify changes |
| `docs/review-protocol.md` | Review PRs |
| `docs/decisions/README.md` | Understand architecture decisions |
| `.tours/README.md` | Learn flows interactively |
| `docs/DEPLOYMENT.md` | Deploy, prod env |
| `docs/GITHUB_APP_SETUP.md` | GitHub App config |
| `docs/GITHUB_WEBHOOK_SETUP.md` | Webhook URL & debugging |
| `docs/STRIPE_SETUP.md` | Billing integration |
| `docs/PHASE3_SETUP.md` | AI + Inngest + pipeline |
| `docs/PHASE4_SETUP.md` | Email + review links |
| `supabase/README.md` | DB bootstrap |
| `instructions.md` / `instructionsV2.md` | Product requirements |
| `.cursor/rules/project-conventions.mdc` | Daily conventions |
| `.cursor/rules/blast-radius.mdc` | Risky couplings |
| `.cursor/plans/Ui-design-spec.md` | Visual/UX north star — colors, tokens, layout, components |
