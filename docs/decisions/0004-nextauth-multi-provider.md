# ADR-0004: NextAuth v5 with multi-provider auth

## Status

Accepted (retroactive)

## Context

Users need to sign in via email/password or OAuth (Google, GitHub). The auth system must:
- Support multiple providers
- Integrate with Next.js App Router
- Store user identity in Supabase for app data association

*Inferred from code as of 2026-03-23:* `src/auth.ts` configures NextAuth with Credentials, Google, and GitHub providers. The `signIn` callback calls `getOrCreateUser()` to sync OAuth users to the `users` table.

## Decision

Use **NextAuth v5** with:
- **Credentials provider** for email/password (bcrypt-hashed passwords in `users.password_hash`)
- **Google provider** for OAuth
- **GitHub provider** for OAuth

Store a unified `auth_id` in `users`:
- OAuth users: provider-supplied ID (e.g., `google|123456`)
- Credentials users: `cred|{email}`

The `getOrCreateUser(authId, email)` function ensures every authenticated user has a `users` row.

## Consequences

**Positive:**
- Single auth configuration handles all providers
- Session-based auth with JWT strategy
- Easy to add more OAuth providers

**Negative / Trade-offs:**
- `auth_id` pattern (`cred|email` vs OAuth IDs) must be consistent across codebase
- Credentials provider requires secure password handling (bcrypt, reset flow)
- NextAuth v5 is still in beta (as of implementation)

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Supabase Auth | Wanted unified NextAuth patterns; already using Supabase only for DB |
| Auth0 | External service cost; NextAuth sufficient for current scale |
| Clerk | Same reasoning; adds external dependency |

## Relevant Files

- `src/auth.ts` — NextAuth configuration (providers, callbacks)
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth route handler
- `src/lib/db/users.ts` — `getOrCreateUser`, `getCredentialUser`, password functions
- `src/app/signin/`, `src/app/signup/` — auth UI and actions
- `src/app/forgot-password/`, `src/app/reset-password/` — password reset flow
