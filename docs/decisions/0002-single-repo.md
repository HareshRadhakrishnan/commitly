# ADR-0002: Single-repo structure

## Status

Accepted (retroactive)

## Context

The project needed a repository structure. Options ranged from a single package to a monorepo with separate frontend/backend packages.

*Inferred from code as of 2026-03-23:* A single `package.json` at the repo root with no `workspaces` field or monorepo tooling (Turborepo, Nx, pnpm workspaces) suggests a deliberate choice for simplicity.

## Decision

Maintain a **single-repo, single-package structure**. All code (frontend, API, background jobs) lives in one Next.js application.

## Consequences

**Positive:**
- Simpler dependency management (one `package.json`, one `node_modules`)
- No cross-package import configuration
- Faster local development iteration
- Easier deployment (single Vercel project)

**Negative / Trade-offs:**
- If the app grows significantly, may need to split into packages
- No isolation between "services" (all code can import anything)

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Monorepo (Turborepo) | Overkill for current app size; adds tooling complexity |
| Separate repos (frontend + API) | Coordination overhead; Next.js handles both well |

## Relevant Files

- `package.json` — single package definition
- `src/` — all application code in one tree
