# ADR-0008: Resend for transactional email

## Status

Accepted (retroactive)

## Context

Commitly AI sends transactional emails:
- Password reset links
- Draft notification ("We detected a significant update!")

Requirements: reliable delivery, simple API, HTML templates.

*Inferred from code as of 2026-03-23:* `src/lib/email/resend.ts` uses the Resend SDK. Email templates are inline HTML strings.

## Decision

Use **Resend** for transactional email:
- SDK: `resend` npm package
- Templates: inline HTML in send functions
- Sender: configurable via `RESEND_FROM` env var

## Consequences

**Positive:**
- Simple send API
- Good deliverability
- Free tier sufficient for MVP
- Dashboard for delivery debugging

**Negative / Trade-offs:**
- Inline HTML templates are hard to maintain at scale
- No template versioning or preview system
- Rate limiting must be handled in app (see `countRecentDraftsForProject`)

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| SendGrid | More complex; Resend simpler for transactional use case |
| Postmark | Similar capability; Resend API preferred |
| AWS SES | More setup; Resend managed service easier |
| React Email | Could add for better templates; inline HTML sufficient for now |

## Relevant Files

- `src/lib/email/resend.ts` — `sendPasswordResetEmail`, `sendDraftNotificationEmail`
- `src/inngest/functions/process-push.ts` — sends draft notification
- `src/app/forgot-password/actions.ts` — sends password reset
- `docs/PHASE4_SETUP.md` — Resend configuration
