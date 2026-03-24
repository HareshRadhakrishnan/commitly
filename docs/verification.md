# Verification Guide

How to verify changes in Commitly before committing or merging.

---

## TL;DR

| Changed | Verify with |
|---------|-------------|
| Any code | `npm run lint && npm run build` |
| DB schema | Re-run SQL in Supabase; update `src/lib/db/types.ts` |
| Webhook / Inngest | Push to test repo; check Inngest dashboard |
| AI / prompts | Trigger significant push; confirm JSON parses |
| Stripe | Stripe CLI forward; test checkout flow |
| Auth | Sign in with all providers; check `users` row |
| Email | Check Resend dashboard; verify links |

**Gap:** No `npm test` script. Verification is manual + build-time checks.

---

## Quick Reference

### Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build (catches type errors) |
| `npm run lint` | ESLint check |
| `npx inngest-cli@latest dev` | Inngest dev server (background jobs) |
| `stripe listen --forward-to localhost:3000/api/stripe/webhook` | Stripe webhook forwarding |

### Manual Flows

| Flow | Steps |
|------|-------|
| Auth (credentials) | Sign up → Sign in → Check `users` row in Supabase |
| Auth (OAuth) | Sign in with Google/GitHub → Check `users.auth_id` |
| Repo connect | Dashboard → Connect GitHub → Select repo → Verify `projects` row |
| Push → Draft | Push to connected repo → Inngest run completes → `release_drafts` row created |
| Billing | Dashboard → Billing → Upgrade → Complete checkout → `users.subscription_tier` = `founder` |

---

## Deep Dive

### TypeScript / React Changes

1. **Run lint**: `npm run lint`
2. **Run build**: `npm run build` — catches type errors, missing imports
3. **Manual test**: Navigate to affected pages in browser

### Database Schema Changes

1. **Create migration**: New file `supabase/migrations/00X_*.sql`
2. **Run in Supabase**: Dashboard → SQL Editor → paste and run
3. **Update types**: Edit `src/lib/db/types.ts` to match new columns
4. **Update queries**: Check all `.select()` calls in `src/lib/db/*.ts` for new/changed columns
5. **Check blast-radius**: See [.cursor/rules/blast-radius.mdc](../.cursor/rules/blast-radius.mdc)

### GitHub Webhook / Inngest

**Setup:**
1. Start dev server: `npm run dev`
2. Start Inngest: `npx inngest-cli@latest dev`
3. Expose localhost (ngrok or similar) if testing from GitHub

**Verification:**
1. Push a commit to a connected repo
2. Check Inngest dashboard (http://localhost:8288) for `github/push` event
3. Verify `process-push` function completes all steps
4. Check `release_drafts` table for new row
5. Check email (Resend dashboard) if `RESEND_API_KEY` configured

**Troubleshooting:**
- No event received: Check webhook URL in GitHub App settings
- Signature error: Verify `GITHUB_WEBHOOK_SECRET` matches GitHub App
- Function fails: Check Inngest logs for step errors

### AI / Prompts

1. **Trigger**: Push significant commit (new feature, not "typo fix")
2. **Check significance**: Inngest `check-significance` step returns `true`
3. **Check generation**: Inngest `generate-content` step completes
4. **Verify JSON**: Review `release_drafts.ai_content` — should have `changelog`, `linkedin`, `twitter` keys
5. **Prompt changes**: If you modified `src/lib/ai/prompts.ts`, ensure JSON structure in prompt matches parsing in `src/lib/ai/generate.ts`

### Stripe Billing

**Setup:**
1. Start Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Copy webhook signing secret to `.env.local` as `STRIPE_WEBHOOK_SECRET`
3. Ensure `STRIPE_PRICE_FOUNDER` is set

**Verification:**
1. Go to Dashboard → Billing → Upgrade
2. Complete Stripe Checkout (use test card `4242 4242 4242 4242`)
3. Check Stripe CLI output for `checkout.session.completed`
4. Verify `users.subscription_tier` = `founder` in Supabase
5. Test Customer Portal: Billing → Manage Subscription

### Authentication

**Credentials flow:**
1. Sign up with email/password
2. Check `users` row: `auth_id` = `cred|{email}`, `password_hash` populated
3. Sign out → Sign in → Verify session works

**OAuth flow:**
1. Sign in with Google or GitHub
2. Check `users` row: `auth_id` = provider ID, `password_hash` = null
3. Verify dashboard access

**Password reset:**
1. Click "Forgot password"
2. Check Resend dashboard for email
3. Use reset link → Set new password → Sign in

### Protected Pages / Server Actions

1. Sign out
2. Navigate to `/dashboard` — should redirect to `/signin`
3. Sign in
4. Verify page loads with correct user data
5. Test server actions (connect repo, add brand example, etc.)

### Email Notifications

1. Trigger a significant push (see Webhook section)
2. Check Resend dashboard for sent email
3. Verify email link uses correct `NEXT_PUBLIC_APP_URL`
4. Click link → Should open review page

---

## Known Gaps

| Gap | Workaround |
|-----|------------|
| No `npm test` script | Manual verification + type checking |
| No e2e tests | Manual flow testing |
| No CI pipeline defined | Run lint/build locally before push |

---

## Relevant Files

- `package.json` — available scripts
- `src/lib/db/types.ts` — must match migrations
- `src/lib/ai/generate.ts` — JSON parsing of AI output
- `src/app/api/webhooks/github/route.ts` — webhook entry point
- `src/inngest/functions/process-push.ts` — background job steps

---

## See also

- [docs/review-protocol.md](review-protocol.md) — code review checklists
- [docs/PHASE3_SETUP.md](PHASE3_SETUP.md) — AI pipeline setup
- [docs/PHASE4_SETUP.md](PHASE4_SETUP.md) — email setup
- [docs/STRIPE_SETUP.md](STRIPE_SETUP.md) — Stripe configuration
- [AGENTS.md](../AGENTS.md) — task router and commands
