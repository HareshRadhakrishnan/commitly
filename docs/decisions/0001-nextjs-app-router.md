# ADR-0001: Next.js App Router

## Status

Accepted (retroactive)

## Context

Commitly AI needed a full-stack framework for:
- Server-rendered pages with auth protection
- API routes for webhooks (GitHub, Stripe, Inngest)
- Server Actions for form mutations
- Static landing pages

*Inferred from code as of 2026-03-23:* The `src/app/` directory structure and `next.config.ts` indicate App Router was chosen from project inception. No Pages Router files exist.

## Decision

Use **Next.js 16 with App Router** as the single application shell. All pages, API routes, and server actions live under `src/app/`.

## Consequences

**Positive:**
- Unified routing: pages, API, and actions in one directory tree
- React Server Components for data fetching in pages
- Built-in support for streaming (not currently used but available)
- Vercel-optimized deployment

**Negative / Trade-offs:**
- Learning curve for developers unfamiliar with App Router conventions
- Some Next.js ecosystem libraries still assume Pages Router

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Next.js Pages Router | Older pattern; App Router is the recommended path forward |
| Remix | Smaller ecosystem; team familiarity with Next.js |
| SvelteKit | Would require learning new framework; React expertise in place |

## Relevant Files

- `src/app/` — all pages, layouts, API routes
- `next.config.ts` — Next.js configuration
- `package.json` — `next: "16.1.6"` dependency
