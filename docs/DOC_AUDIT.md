# Documentation Consistency Audit

*Generated 2026-03-23 after creating ADRs, verification docs, review protocol, and code tours.*

---

## 1. Weaknesses

| Issue | Location | Impact |
|-------|----------|--------|
| **Tour line numbers will drift** | `.tours/*.tour` | After code edits, tour steps may point to wrong lines. Requires manual re-anchoring. |
| **ADRs are retroactive** | `docs/decisions/0001-0010.md` | Context sections contain inferred rationale, not original decision notes. Marked explicitly. |
| **No automated test suite** | `package.json` | `docs/verification.md` relies on manual testing + lint/build. Can't verify behavior automatically. |
| **Inline HTML email templates** | `src/lib/email/resend.ts` | Hard to maintain; no preview system. Not a doc issue but noted in ADR-0008. |
| **Canonical examples staleness** | `docs/canonical-examples.md` | Header says "last_verified: 2026-03-23" but no automated check. Must remember to update. |
| **Blast-radius rule is static** | `.cursor/rules/blast-radius.mdc` | If new couplings emerge, rule must be manually updated. |

---

## 2. Proposed Improvements

| Improvement | Effort | Benefit |
|-------------|--------|---------|
| **Add `npm test` with Vitest** | Medium | Automated verification; `verification.md` can point to `npm test` |
| **Add Playwright e2e tests** | High | Verify full flows (auth, billing, push-to-draft) |
| **Use React Email for templates** | Low | Preview emails; cleaner templates |
| **Move tours to `.vscode/tours`** | Low | Standard CodeTour location; better extension support |
| **Add Inngest step mocks** | Medium | Test `process-push` without live AI/GitHub |
| **Schema drift detection** | Medium | Script comparing `supabase/migrations` → `types.ts` |

---

## 3. Missing Docs / Rules

These were identified as "Planned" in `docs/README.md` but not yet created:

| Doc | Purpose | Priority |
|-----|---------|----------|
| `docs/ENV_REFERENCE.md` | Single table of all env vars (required/optional, where used) | High |
| `docs/INNGEST_SETUP.md` | Local dev server, function registration, prod signing | High |
| `docs/push-to-draft-pipeline.md` | Mermaid sequence diagram of webhook → AI → email | Medium |
| `docs/CONTRIBUTING.md` | PR checklist, commit conventions, testing expectations | Medium |
| `docs/RUNBOOK.md` | Operational runbook: incidents, rollback, webhook debugging | Low |

---

## 4. Generic Sections to Rewrite

All new docs are grounded in real file paths. Spot-check passed:

| Doc | Check | Status |
|-----|-------|--------|
| `docs/verification.md` | Task tables reference real files | OK |
| `docs/review-protocol.md` | Blast-radius section links to real rule | OK |
| `docs/decisions/*.md` | "Relevant Files" sections list real paths | OK |
| `.tours/*.tour` | `file` properties are valid paths | OK |

**No generic sections found** that need rewriting.

---

## 5. AI Discoverability Checks

### Can a future agent find where to start for common tasks?

| Task | Discoverable via | Verdict |
|------|------------------|---------|
| Add a new page | `AGENTS.md` Task Router → `src/app/dashboard/page.tsx` | OK |
| Change DB schema | `AGENTS.md` Task Router → `supabase/migrations/` | OK |
| Understand why Inngest | `docs/decisions/0005-inngest-background-jobs.md` | OK |
| Verify a webhook change | `docs/INDEX.md` → `docs/verification.md` → GitHub Webhook section | OK |
| Review a PR | `docs/INDEX.md` → `docs/review-protocol.md` | OK |

### Are key invariants explicit?

| Invariant | Location | Duplicated? |
|-----------|----------|-------------|
| All DB access via `supabaseAdmin` | `AGENTS.md` Key Invariants (line 1) | Also in `review-protocol.md` checklist — acceptable (reference link) |
| Auth enforced in app code | `AGENTS.md` Key Invariants (line 2) | Also in `docs/decisions/0003-supabase-postgres.md` |
| User ID mapping pattern | `AGENTS.md` Key Invariants (line 3) | Also in `docs/decisions/0004-nextauth-multi-provider.md` |

**Conclusion:** Invariants live in `AGENTS.md` as canonical source; other docs reference or summarize. No problematic duplication.

### Are canonical examples helpful?

| Pattern | Skeleton provided | Imports real | Verdict |
|---------|-------------------|--------------|---------|
| Protected Page | Yes | `@/auth`, `@/lib/db/users` | OK |
| API Route | Yes | `@/auth`, `@/lib/db/users` | OK |
| Inngest Function | Yes | `../client` | OK |
| Server Action | Yes | `@/auth`, `revalidatePath` | OK |

**Conclusion:** All skeletons use real imports from this codebase.

### Are docs concise enough?

| Doc | Lines | Verdict |
|-----|-------|---------|
| `AGENTS.md` | ~200 | OK — single-page reference |
| `docs/verification.md` | ~160 | OK — scannable tables |
| `docs/review-protocol.md` | ~140 | OK — checklist-heavy |
| `docs/decisions/*.md` | ~40-70 each | OK — focused per decision |
| `.tours/*.tour` | ~100 steps total | OK — consumed by extension |

**No bloat detected.** Docs fit comfortably in context windows.

---

## 6. Cross-Linking Coverage

### Every doc linked from `docs/README.md`?

| Doc | Linked | Section |
|-----|--------|---------|
| `AGENTS.md` | Yes | Start Here, Build, Verify, Operations, Reference |
| `docs/canonical-examples.md` | Yes | Start Here, Build, Verify |
| `docs/decisions/README.md` | Yes | Start Here, Reference |
| `docs/verification.md` | Yes | Verify |
| `docs/review-protocol.md` | Yes | Verify |
| `.tours/README.md` | Yes | Start Here, Reference |
| `docs/DEPLOYMENT.md` | Yes | Set Up, Operations |
| `docs/GITHUB_*` | Yes | Deep Dives, Set Up |
| `docs/STRIPE_SETUP.md` | Yes | Deep Dives, Set Up |
| `docs/PHASE3_SETUP.md` | Yes | Understand, Set Up |
| `docs/PHASE4_SETUP.md` | Yes | Understand, Set Up |

**Full coverage.**

### Every doc discoverable from `docs/INDEX.md`?

| Doc | Intent row exists |
|-----|-------------------|
| `AGENTS.md` | Yes ("Orient in the repo fast") |
| `docs/verification.md` | Yes ("Verify a change before committing") |
| `docs/review-protocol.md` | Yes ("Review a PR / self-review") |
| `docs/decisions/README.md` | Yes ("Understand why a decision was made") |
| `.tours/README.md` | Yes ("Learn a flow interactively") |

**Full coverage.**

---

## 7. Summary

**Documentation system is consistent and AI-usable.**

Next actions (priority order):
1. Create `docs/ENV_REFERENCE.md` — high-value for onboarding
2. Create `docs/INNGEST_SETUP.md` — needed for local dev
3. Add `npm test` script and basic tests
4. Create `docs/CONTRIBUTING.md` before opening to external contributors

---

*This audit should be re-run after significant documentation changes.*
