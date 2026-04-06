# Commitly AI documentation

Categorized entry point for humans and AI. Prefer **tables** and **short bullets**; follow links for depth.

---

## Start Here / Onboarding

| Doc | What you get |
|-----|----------------|
| [AGENTS.md](../AGENTS.md) | Codebase map, commands, task router, invariants |
| [docs/canonical-examples.md](canonical-examples.md) | Copy-paste patterns (pages, API routes, actions, DB, Inngest) |
| [docs/decisions/README.md](decisions/README.md) | Architecture decisions (ADRs) with context and rationale |
| [supabase/README.md](../supabase/README.md) | Run SQL migrations in Supabase |
| [.tours/README.md](../.tours/README.md) | Interactive code tours for key flows |

---

## Understand the System

| Doc | What you get |
|-----|----------------|
| [instructions.md](../instructions.md) | MVP PRD: product scope and phased build |
| [instructionsV2.md](../instructionsV2.md) | V2 PRD: repos, billing, brand voice, deferred items |
| [docs/PHASE3_SETUP.md](PHASE3_SETUP.md) | AI pipeline context (OpenAI, repo connect, Inngest) |
| [docs/PHASE4_SETUP.md](PHASE4_SETUP.md) | Email + review UI flow (Resend, review URLs) |

---

## Build Something

| Doc | What you get |
|-----|----------------|
| [docs/canonical-examples.md](canonical-examples.md) | Canonical files per pattern—copy these, not ad-hoc variants |
| [AGENTS.md](../AGENTS.md) → Task Router | Where to start for new pages, APIs, schema, AI, webhooks |

---

## Verify / Review / Document

| Doc | What you get |
|-----|----------------|
| [docs/verification.md](verification.md) | How to verify changes by task type |
| [docs/review-protocol.md](review-protocol.md) | Self-review and code-review checklists |
| [AGENTS.md](../AGENTS.md) → Common Mistakes | Anti-patterns that break silently |
| [.cursor/rules/blast-radius.mdc](../.cursor/rules/blast-radius.mdc) | High-risk couplings before commit |
| [docs/canonical-examples.md](canonical-examples.md) | Staleness note + "Relevant Files" when examples drift |

---

## Deep Dives

| Doc | What you get |
|-----|----------------|
| [docs/GITHUB_APP_SETUP.md](GITHUB_APP_SETUP.md) | GitHub App: permissions, setup URL, installation flow |
| [docs/GITHUB_WEBHOOK_SETUP.md](GITHUB_WEBHOOK_SETUP.md) | Webhook URL, secret, push events, local testing |
| [docs/STRIPE_SETUP.md](STRIPE_SETUP.md) | Products, webhooks, env vars, Stripe CLI |
| [supabase/migrations/](../supabase/migrations/) | Authoritative schema (run order `001` → `006`) |

---

## Set Up / Debug

| Doc | What you get |
|-----|----------------|
| [docs/DEPLOYMENT.md](DEPLOYMENT.md) | Vercel deploy + env var checklist |
| [docs/GITHUB_WEBHOOK_SETUP.md](GITHUB_WEBHOOK_SETUP.md) | ngrok, signature failures, delivery |
| [docs/STRIPE_SETUP.md](STRIPE_SETUP.md) | Local webhook forwarding |
| [docs/PHASE3_SETUP.md](PHASE3_SETUP.md) | OpenAI + Inngest + "significant push" expectations |
| [docs/PHASE4_SETUP.md](PHASE4_SETUP.md) | Resend + `NEXT_PUBLIC_APP_URL` for email links |

---

## Operations / Safety

| Doc | What you get |
|-----|----------------|
| [docs/DEPLOYMENT.md](DEPLOYMENT.md) | Production env vars (never commit secrets) |
| [AGENTS.md](../AGENTS.md) → Key Invariants | Service role, webhooks, Inngest boundaries |
| [.cursor/rules/project-conventions.mdc](../.cursor/rules/project-conventions.mdc) | Global conventions (always-on in Cursor) |

---

## Reference

| Doc | What you get |
|-----|----------------|
| [AGENTS.md](../AGENTS.md) | Single-page ops + architecture notes |
| [docs/canonical-examples.md](canonical-examples.md) | Pattern registry + skeletons |
| [docs/decisions/README.md](decisions/README.md) | ADR index — why decisions were made |
| [.tours/README.md](../.tours/README.md) | Code tours index |
| [package.json](../package.json) | Scripts and dependency versions |
| [docs/DEPLOYMENT.md](DEPLOYMENT.md) | Env var names and deployment steps |

---

## Planned docs (not in repo yet)

Concrete additions worth adding next:

| Future file | Purpose |
|-------------|---------|
| `docs/ENV_REFERENCE.md` | One table of every env var (dev + prod), where it's read, required optional |
| `docs/INNGEST_SETUP.md` | Inngest dev server, registering functions, prod signing keys |
| `docs/push-to-draft-pipeline.md` | Sequence diagram–style: webhook → Inngest → AI → DB → email |
| `docs/CONTRIBUTING.md` | PR checklist, lint, migrations, blast-radius spot-checks |

---

## Quick links

| Link | Use |
|------|-----|
| [docs/INDEX.md](INDEX.md) | "I need to…" intent lookup |
| [AGENTS.md](../AGENTS.md) | Navigate the codebase |
| [docs/canonical-examples.md](canonical-examples.md) | Copy a pattern |
| [docs/verification.md](verification.md) | Verify a change |
| [docs/review-protocol.md](review-protocol.md) | Review checklist |
| [docs/decisions/README.md](decisions/README.md) | Understand why |
| [.tours/README.md](../.tours/README.md) | Learn a flow interactively |
| [docs/DEPLOYMENT.md](DEPLOYMENT.md) | Ship to Vercel |
| [supabase/README.md](../supabase/README.md) | Database setup |
