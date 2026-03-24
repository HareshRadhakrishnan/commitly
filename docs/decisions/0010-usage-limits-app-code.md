# ADR-0010: Usage limits enforced in application code

## Status

Accepted (retroactive)

## Context

Subscription tiers have different limits:
- Free: 1 repo, 3 drafts/month
- Founder: unlimited
- Team: unlimited

These limits must be enforced before creating drafts or connecting repos.

*Inferred from code as of 2026-03-23:* `src/lib/subscription.ts` defines `TIER_LIMITS` and helper functions. `src/inngest/functions/process-push.ts` calls `canCreateDraft()` before generating. `src/app/dashboard/actions.ts` calls `canConnectRepo()` before connecting.

## Decision

Enforce usage limits **in application code**, not database constraints:
- `usage_records` table tracks draft counts per user per month
- `subscription.ts` exports `canCreateDraft()`, `canConnectRepo()`, `getTierLimits()`
- Inngest function checks limits before AI generation
- Dashboard actions check limits before repo connection

## Consequences

**Positive:**
- Flexible limit logic (easy to change tiers, add grace periods)
- Clear error messages to users
- Limits enforced at the right layer (before expensive operations)

**Negative / Trade-offs:**
- Race conditions theoretically possible (two requests check simultaneously)
- Limit definitions spread across code and migrations (CHECK constraint in SQL)
- Must remember to check limits in all relevant code paths

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Database triggers | Harder to return user-friendly errors |
| Middleware-based limits | Too coarse; limits are per-resource |
| External rate limiting (Redis) | Overkill; usage_records table sufficient |

## Relevant Files

- `src/lib/subscription.ts` — `TIER_LIMITS`, `canCreateDraft()`, `canConnectRepo()`
- `src/lib/db/usage.ts` — `getDraftCountForUserThisMonth()`, `incrementDraftCount()`
- `src/inngest/functions/process-push.ts` — checks limits in `check-usage-limit` step
- `src/app/dashboard/actions.ts` — checks `canConnectRepo()` before insert
- `supabase/migrations/004_subscription_schema.sql` — `usage_records` table, tier CHECK constraint
