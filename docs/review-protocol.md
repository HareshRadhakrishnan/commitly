# Review Protocol

Self-review and code-review checklists for Commitly AI. Use before committing or approving PRs.

---

## TL;DR

Before committing:
1. `npm run lint && npm run build`
2. Check blast-radius (did you change a coupled file?)
3. Verify manually (see [verification.md](verification.md))
4. Update docs if needed

---

## Quick Reference

### Universal Checklist

| Check | Question |
|-------|----------|
| Types | Does it compile? (`npm run build`) |
| Lint | Does it lint? (`npm run lint`) |
| Error paths | Are errors handled, not swallowed? |
| Secrets | No secrets in client code or logs? |
| Signatures | Webhook signature verified before processing? |
| Auth | Protected routes check `auth()` + `session?.user`? |
| User lookup | Using `getOrCreateUser(authId, email)` pattern? |

### AI Self-Review Checklist

When an AI agent makes changes:

| Check | Verification |
|-------|--------------|
| Blast-radius | Reviewed [.cursor/rules/blast-radius.mdc](../.cursor/rules/blast-radius.mdc)? |
| Invariants | Changes respect [AGENTS.md Key Invariants](../AGENTS.md)? |
| Canonical examples | If changed a canonical file, updated header in [docs/canonical-examples.md](canonical-examples.md)? |
| Single source | Not duplicating logic from existing helpers? |
| Supabase client | Using `supabaseAdmin` from `lib/supabase/server.ts`? |
| Background jobs | Long operations dispatched to Inngest, not inline? |

---

## Deep Dive

### Common Reviewer Gaps

These are frequently missed in reviews:

| Area | What to check |
|------|---------------|
| Auth ID pattern | Is `session.user.id ?? session.user.email` used consistently? Credential users have `cred|email`, OAuth users have provider ID |
| Inngest event shape | Does the event in `inngest.send()` match the type expected in the function? |
| Stripe metadata | Does checkout session include `user_id` in metadata AND subscription_data.metadata? |
| JSON parsing | If AI prompt changed, does `generate.ts` still parse the expected keys? |
| Migration sync | If schema changed, are `types.ts` and `.select()` calls updated? |

### Blast-Radius Checks

Before committing changes to these files, verify coupled files:

| If you touched | Also check |
|----------------|------------|
| `supabase/migrations/*.sql` | `src/lib/db/types.ts`, all `src/lib/db/*.ts` queries |
| `src/lib/ai/prompts.ts` | `src/lib/ai/generate.ts` (JSON parsing) |
| `src/app/api/webhooks/github/route.ts` | `src/inngest/functions/process-push.ts` (event shape) |
| `src/lib/subscription.ts` (TIER_LIMITS) | Migration CHECK constraint, `src/app/api/stripe/webhook/route.ts` |
| `src/auth.ts` | All pages using `session.user.id ?? session.user.email` |
| `src/lib/db/types.ts` | All files importing from it |

Full list: [.cursor/rules/blast-radius.mdc](../.cursor/rules/blast-radius.mdc)

### Docs-Update Checks

| Change type | Update |
|-------------|--------|
| New migration | Check if `types.ts` needs update |
| New env var | Add to [docs/DEPLOYMENT.md](DEPLOYMENT.md) |
| New API route | Consider adding to [AGENTS.md Task Router](../AGENTS.md) |
| New pattern | Add to [docs/canonical-examples.md](canonical-examples.md) if reusable |
| Architecture decision | Create ADR in [docs/decisions/](decisions/README.md) |

### Invariant Checks

These must never be violated (from [AGENTS.md Key Invariants](../AGENTS.md)):

1. **All DB access uses `supabaseAdmin`** — Never create new Supabase clients
2. **Auth in application code** — Always check `session?.user`, no RLS dependency
3. **User ID mapping** — Use `getOrCreateUser(authId, email)` to get DB user
4. **Background jobs via Inngest** — Never run long operations in API routes
5. **Subscription checks** — Use `canCreateDraft()`/`canConnectRepo()`, never hardcode
6. **Stripe metadata** — `user_id` must be in session and subscription metadata
7. **Webhook response time** — GitHub webhook must respond <10s, dispatch to Inngest

### Security Checks

| Check | Details |
|-------|---------|
| No secrets logged | Don't `console.log` API keys, tokens, passwords |
| No secrets in client | Only `NEXT_PUBLIC_*` vars available client-side |
| Webhook verification | GitHub: `verifyWebhookSignature()`, Stripe: `constructEvent()` |
| Password hashing | Use bcrypt with cost factor 12 |
| Token storage | If storing OAuth tokens, encrypt at rest (see future ADR) |

---

## Review Workflow

### Self-Review (before pushing)

1. Run `npm run lint && npm run build`
2. Scan diff for blast-radius triggers
3. Manually test affected flows ([verification.md](verification.md))
4. Check if docs need updating
5. Write clear commit message

### PR Review (for reviewers)

1. Verify CI passes (lint, build)
2. Check blast-radius: any coupled files missed?
3. Check invariants: any violations?
4. Check security: secrets, auth, verification
5. Test locally if significant change
6. Verify docs updated if needed

---

## Relevant Files

- [.cursor/rules/blast-radius.mdc](../.cursor/rules/blast-radius.mdc) — coupling warnings
- [.cursor/rules/project-conventions.mdc](../.cursor/rules/project-conventions.mdc) — global conventions
- [AGENTS.md](../AGENTS.md) — key invariants and task router
- [docs/canonical-examples.md](canonical-examples.md) — pattern registry
- [docs/verification.md](verification.md) — how to verify changes

---

## See also

- [docs/verification.md](verification.md) — verification steps by change type
- [docs/decisions/](decisions/README.md) — architecture decisions
- [AGENTS.md](../AGENTS.md) → Common Mistakes — anti-patterns to avoid
