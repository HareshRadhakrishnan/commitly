# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for Commitly.

---

## What are ADRs?

ADRs document **significant technical decisions** along with their context, consequences, and alternatives considered. They create an immutable history: once accepted, ADRs are not edited—only superseded by newer ADRs if the decision changes.

**Honesty note:** ADRs numbered 0001–0010 were created **retroactively** after the initial implementation. The rationale in these records is **inferred from code and commit history**, not from original meeting notes or design documents. Inferred sections are marked explicitly.

---

## Index

| ADR | Title | Status | Summary |
|-----|-------|--------|---------|
| [0001](0001-nextjs-app-router.md) | Next.js App Router | Accepted (retroactive) | Single Next.js 16 app using App Router for all pages and API routes |
| [0002](0002-single-repo.md) | Single-repo structure | Accepted (retroactive) | One package.json, not a monorepo |
| [0003](0003-supabase-postgres.md) | Supabase Postgres without RLS | Accepted (retroactive) | Supabase JS client with service_role; RLS disabled for MVP |
| [0004](0004-nextauth-multi-provider.md) | NextAuth v5 with multi-provider | Accepted (retroactive) | Credentials + Google + GitHub; users.auth_id sync pattern |
| [0005](0005-inngest-background-jobs.md) | Inngest for background jobs | Accepted (retroactive) | Webhook dispatches to Inngest; AI/email runs in background |
| [0006](0006-openai-vercel-ai-sdk.md) | OpenAI via Vercel AI SDK | Accepted (retroactive) | Non-streaming generateText for batch processing |
| [0007](0007-stripe-checkout-webhooks.md) | Stripe Checkout + webhooks | Accepted (retroactive) | Subscription tiers stored on users table |
| [0008](0008-resend-email.md) | Resend for transactional email | Accepted (retroactive) | Inline HTML templates; draft notifications |
| [0009](0009-github-app-push-webhook.md) | GitHub App with push webhook | Accepted (retroactive) | Installation-based repo discovery; push events to /api/webhooks/github |
| [0010](0010-usage-limits-app-code.md) | Usage limits in application code | Accepted (retroactive) | usage_records table + subscription.ts helpers |

---

## Non-ADRs (explicit exclusions)

These topics were considered but do not warrant separate ADRs:

- **No separate ORM (Prisma/Drizzle):** Covered under [ADR-0003](0003-supabase-postgres.md) consequences—Supabase JS client is sufficient for current queries.
- **No automated test suite:** Acknowledged gap; see verification docs. May become ADR-0011 when test strategy is chosen.

---

## How to add a new ADR

1. Copy [TEMPLATE.md](TEMPLATE.md) to `docs/decisions/NNNN-kebab-title.md`
   - `NNNN` = next available number (max existing + 1, zero-padded to 4 digits)
2. Fill in all sections; mark inferences explicitly
3. Set **Status** to `Proposed` for discussion or `Accepted` if already implemented
4. Update the **Index** table above
5. Cross-link from [AGENTS.md](../../AGENTS.md) or [docs/INDEX.md](../INDEX.md) if the decision affects task routing

---

## See also

- [AGENTS.md](../../AGENTS.md) — Key Invariants derived from these decisions
- [docs/canonical-examples.md](../canonical-examples.md) — Code patterns that implement these decisions
- [.cursor/rules/blast-radius.mdc](../../.cursor/rules/blast-radius.mdc) — Coupling risks when changing decision-related code
