# ADR-0003: Supabase Postgres without RLS

## Status

Accepted (retroactive)

## Context

The application needed a database for users, projects, release drafts, and usage tracking. Requirements:
- PostgreSQL for relational data
- Hosted solution to minimize ops burden
- SDK for server-side queries

*Inferred from code as of 2026-03-23:* The comment in `001_initial_schema.sql` explicitly states "RLS disabled for MVP: we use NextAuth + service_role for server-side access. Authorization is enforced in application code via session checks."

## Decision

Use **Supabase (PostgreSQL)** with the JavaScript client. Disable Row-Level Security (RLS) for MVP; enforce authorization in application code by checking the NextAuth session.

Use `service_role` key server-side via `supabaseAdmin`. No separate ORM (Prisma, Drizzle)—Supabase client's query builder is sufficient.

## Consequences

**Positive:**
- Fast setup with hosted Postgres
- Simple query syntax without ORM migration files
- Dashboard UI for debugging and running SQL

**Negative / Trade-offs:**
- No compile-time type safety on queries (must manually sync `types.ts`)
- No RLS means a bug in session checking could expose data
- Schema changes require manual SQL + type updates (see blast-radius rule)

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Prisma | Extra migration tooling; Supabase client sufficient for current queries |
| Drizzle | Same reasoning; adds complexity without clear benefit at this scale |
| PlanetScale (MySQL) | Team preference for PostgreSQL |
| Self-hosted Postgres | Ops overhead; Supabase free tier adequate |

## Relevant Files

- `supabase/migrations/*.sql` — schema source of truth
- `src/lib/supabase/server.ts` — `supabaseAdmin` client
- `src/lib/db/*.ts` — query functions using Supabase client
- `src/lib/db/types.ts` — TypeScript types (must stay in sync with migrations)
