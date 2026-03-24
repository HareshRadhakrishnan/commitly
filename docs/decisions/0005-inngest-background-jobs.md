# ADR-0005: Inngest for background jobs

## Status

Accepted (retroactive)

## Context

GitHub webhooks must respond within 10 seconds, but the push-to-draft pipeline involves:
- Fetching commit diffs from GitHub API
- AI significance check
- AI content generation
- Database writes
- Email sending

This can take 30+ seconds. A background job system is required.

*Inferred from code as of 2026-03-23:* The webhook at `src/app/api/webhooks/github/route.ts` dispatches a `github/push` event to Inngest and returns immediately. The `process-push` function in `src/inngest/functions/process-push.ts` handles all slow work.

## Decision

Use **Inngest** for background job processing:
- Webhook routes dispatch events via `inngest.send()`
- Inngest functions (`inngest.createFunction()`) process events with step-based execution
- Deployed via `/api/inngest` route handler

## Consequences

**Positive:**
- Webhook responds in <1 second
- Built-in retries and step tracking
- Local dev server for testing (`npx inngest-cli@latest dev`)
- No separate queue infrastructure (Redis, SQS)

**Negative / Trade-offs:**
- Event shape must stay in sync between sender and consumer (blast-radius)
- Requires Inngest account for production
- Step-based execution model has learning curve

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Vercel Functions (async) | No built-in retry/step semantics; harder to debug |
| BullMQ + Redis | Requires Redis infrastructure |
| AWS SQS + Lambda | More complex setup; overkill for current scale |
| Trigger.dev | Similar to Inngest; team familiarity with Inngest |

## Relevant Files

- `src/inngest/client.ts` — Inngest client instance
- `src/inngest/functions/process-push.ts` — main background job
- `src/app/api/inngest/route.ts` — Inngest serve endpoint
- `src/app/api/webhooks/github/route.ts` — dispatches `github/push` event
