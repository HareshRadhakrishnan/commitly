# Commitly AI — AI-Optimized Codebase Guide

Concise, structured reference for AI assistants working in this codebase. Every line earns its token cost.

---

## Codebase Map

```
commitly/
├── src/
│   ├── app/                          # Next.js App Router pages & API routes
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth route handler
│   │   │   ├── github/repos/         # List repos from GitHub App installation
│   │   │   ├── inngest/              # Inngest webhook endpoint
│   │   │   ├── stripe/               # checkout/, portal/, webhook/
│   │   │   ├── webhooks/github/      # GitHub push webhook receiver
│   │   │   └── test-webhook/         # Dev testing endpoint
│   │   ├── dashboard/
│   │   │   ├── billing/              # Subscription management UI
│   │   │   ├── github/callback/      # GitHub App OAuth callback
│   │   │   ├── projects/             # RepoPicker, AddProjectForm
│   │   │   ├── review/[logId]/       # Draft review page
│   │   │   ├── settings/             # Brand voice configuration
│   │   │   ├── actions.ts            # Server actions (connect/disconnect repo)
│   │   │   └── page.tsx              # Main dashboard
│   │   ├── signin/, signup/          # Auth pages + server actions
│   │   ├── forgot-password/, reset-password/
│   │   ├── globals.css               # Tailwind globals
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing page
│   ├── inngest/
│   │   ├── client.ts                 # Inngest instance
│   │   ├── functions/process-push.ts # Main background job: webhook → AI → draft
│   │   ├── functions/index-repo.ts   # Full repo indexing on connect (RAG)
│   │   └── functions/update-embeddings.ts # Incremental re-index on push (RAG)
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── generate.ts           # AI calls (checkSignificance, explainCommits, generateContent)
│   │   │   └── prompts.ts            # Prompt builders for significance + explanation + generation
│   │   ├── db/                       # Supabase data access layer
│   │   │   ├── brand-examples.ts
│   │   │   ├── projects.ts
│   │   │   ├── release-drafts.ts
│   │   │   ├── repo-chunks.ts        # pgvector chunk helpers (RAG)
│   │   │   ├── types.ts              # TypeScript types for DB entities
│   │   │   ├── usage.ts              # Draft count tracking
│   │   │   └── users.ts
│   │   ├── email/resend.ts           # Email sending via Resend
│   │   ├── github/
│   │   │   ├── app.ts                # GitHub App JWT, installation tokens, API calls
│   │   │   ├── chunker.ts            # Function-level file chunker + hunk range parser (RAG)
│   │   │   ├── context.ts            # getFileContext() 4-level fallback + handleDeletedFile() (RAG)
│   │   │   └── webhook.ts            # Webhook signature verification, payload parsing
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client (unused currently)
│   │   │   └── server.ts             # Server-side admin client
│   │   ├── stripe.ts                 # Stripe checkout/portal helpers
│   │   └── subscription.ts           # Tier limits logic
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── dashboard-shell.tsx   # Client shell: sidebar + top bar + Cmd+K + Sheet
│   │   │   └── actions.ts            # signOutAction (server action for shell)
│   │   ├── ui/                       # shadcn/ui primitives (button, card, command, sheet, …)
│   │   ├── auth-card.tsx             # Shared auth page layout wrapper
│   │   └── theme-provider.tsx        # next-themes ThemeProvider wrapper
│   ├── types/
│   │   └── next-auth.d.ts            # NextAuth type augmentation
│   └── auth.ts                       # NextAuth config (providers, callbacks)
├── supabase/
│   ├── migrations/                   # SQL migrations (run manually in Supabase)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_password_auth.sql
│   │   ├── 003_github_app_schema.sql
│   │   ├── 004_subscription_schema.sql
│   │   ├── 005_brand_examples.sql
│   │   └── 006_repo_context.sql      # pgvector, repo_summary, repo_file_chunks (RAG)
│   └── README.md                     # Supabase setup instructions
├── docs/
│   └── STRIPE_SETUP.md               # Stripe configuration guide
├── .cursor/plans/Ui-design-spec.md   # UI/UX visual north star (colors, layout, components)
├── instructions.md                   # PRD v1 (MVP spec)
├── instructionsV2.md                 # PRD v2 (production features)
└── package.json
```

---

## Quick Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx inngest-cli@latest dev` | Start Inngest dev server (for background jobs) |
| `stripe listen --forward-to localhost:3000/api/stripe/webhook` | Forward Stripe webhooks locally |

**Database**: No CLI migrations. Run SQL files manually in Supabase Dashboard → SQL Editor.

---

## Task Router

| Task | Start Files | Notes |
|------|-------------|-------|
| Add a new page | `src/app/{route}/page.tsx` | Use async server components; auth via `auth()` |
| Add a new dashboard page | `src/app/dashboard/{route}/page.tsx` | No header needed — `dashboard/layout.tsx` wraps all children in `DashboardShell` |
| Modify dashboard chrome | `src/components/dashboard/dashboard-shell.tsx` | Sidebar, top bar, Cmd+K, theme toggle, sign out |
| Add UI component | `src/components/ui/{name}.tsx` | Follow shadcn pattern; match existing Tailwind v4 style |
| Follow UI/UX spec | `.cursor/plans/Ui-design-spec.md` | Colors (`--brand`, `--primary`), radius, layout, dark mode |
| Add a new API endpoint | `src/app/api/{route}/route.ts` | Export `GET`, `POST`, etc. Use `NextResponse` |
| Add a new server action | `src/app/{feature}/actions.ts` | Add `"use server"` at top; call from client forms |
| Add a new background job | `src/inngest/functions/{name}.ts` | Create function with `inngest.createFunction()`, register in `api/inngest/route.ts` |
| Change database schema | `supabase/migrations/00X_*.sql` | Create new migration file, run in Supabase SQL Editor |
| Add new DB query | `src/lib/db/{entity}.ts` | Use `supabaseAdmin` from `lib/supabase/server.ts` |
| Modify AI prompts | `src/lib/ai/prompts.ts` | Edit `buildSignificancePrompt`, `buildExplanationPrompt`, or `buildGenerationPrompt` |
| Modify AI generation | `src/lib/ai/generate.ts` | Uses Vercel AI SDK with OpenAI |
| Modify RAG context retrieval | `src/lib/github/context.ts`, `src/lib/db/repo-chunks.ts` | 4-level fallback, pgvector cosine search |
| Modify repo indexing (full) | `src/inngest/functions/index-repo.ts` | Full re-index on `github/repo.connected` |
| Modify repo indexing (incremental) | `src/inngest/functions/update-embeddings.ts` | Per-push re-index, SHA cache, deleted file handling |
| Modify file chunking strategy | `src/lib/github/chunker.ts` | Function-level boundaries, line ranges, content SHA |
| Add email template | `src/lib/email/resend.ts` | Add new function, use inline HTML |
| Add subscription logic | `src/lib/subscription.ts` | Update `TIER_LIMITS`, add tier-checking helpers |
| Add new auth provider | `src/auth.ts` | Add to `providers` array, handle in `signIn` callback |
| Modify GitHub integration | `src/lib/github/app.ts` or `webhook.ts` | App.ts for API calls, webhook.ts for parsing |

---

## Key Invariants

1. **All DB access uses `supabaseAdmin`** from `src/lib/supabase/server.ts`. Never create new Supabase clients.
2. **Auth is enforced in application code**, not RLS. Always call `auth()` and check `session?.user` at the start of protected routes/actions.
3. **User ID mapping**: NextAuth `user.id` is stored as `auth_id` in Supabase `users` table. Use `getOrCreateUser(authId, email)` to get DB user.
4. **Background jobs go through Inngest**. Never run long AI calls or external API calls in API routes. Send an event via `inngest.send()`.
5. **All subscription checks use `canCreateDraft()` / `canConnectRepo()`** from `lib/subscription.ts`. Never hardcode limits.
6. **Stripe user_id is stored in metadata** on both checkout session and subscription. Webhook uses this to update DB.
7. **GitHub webhook must respond in <10 seconds**. Always dispatch to Inngest immediately.
8. **UI token semantics**: `--brand` / `text-brand` = violet accent (links, active icon, highlights). `--primary` = solid black CTA buttons. Never use `text-primary` for inline links — use `text-brand`.
9. **Dashboard chrome is in the layout**. `/dashboard/*` pages must NOT render their own `<header>` or outer `min-h-screen` wrapper — the `DashboardShell` in `dashboard/layout.tsx` provides these.
10. **Server actions in client components**: place in a co-located `actions.ts` file with `"use server"` — do not inline `"use server"` inside client component function bodies.

---

## Common Mistakes

| Don't | Do Instead | Why |
|-------|------------|-----|
| Import `createClient` from `@supabase/supabase-js` directly | Import `supabaseAdmin` from `lib/supabase/server.ts` | Maintains single client instance with correct keys |
| Access `session.user.id` without null checks | Always `session?.user?.id` and handle null case | Session may be absent or malformed |
| Run AI calls directly in API routes | Use Inngest (`inngest.send({...})`) and process in background | GitHub webhooks timeout after 10s; API routes should be fast |
| Hardcode subscription limits (3 drafts, 1 repo) | Use `getTierLimits()` or `canCreateDraft()` | Limits vary by tier and may change |
| Store sensitive data in client components | Keep tokens, keys, API calls in server components/actions | Client code is visible to users |
| Create new migration by editing existing file | Create new numbered file `00X_*.sql` | Existing migrations may already be applied |
| Use `process.env.X` in client components | Prefix with `NEXT_PUBLIC_` or move to server | Non-public env vars aren't available on client |
| Skip webhook signature verification | Always verify via `verifyWebhookSignature()` (GitHub) or `stripe.webhooks.constructEvent()` | Prevents spoofed requests |
| Forget `revalidatePath()` after mutations | Call `revalidatePath('/dashboard/...')` in server actions | Updates cached server components |
| Use Supabase RLS for auth | Auth is in application code via NextAuth session | RLS is disabled in this codebase |
| Add a header/nav inside a dashboard page | The `DashboardShell` in `dashboard/layout.tsx` already provides chrome | Adding per-page headers creates duplicate chrome and visual inconsistency |
| Use `text-primary` for links or accents | Use `text-brand` for violet accents; `text-primary` is black (primary button color) | Semantic mismatch breaks theming |
| Call `getFileContext()` on deleted files | Check `f.status === 'removed'` first; call `handleDeletedFile()` instead | Deleted files have no content at the commit SHA — fetch will always return null |
| Query `repo_file_chunks` with raw diff text as embedding input | Use the stored chunk embedding for cosine search; use `parseHunkRanges(diffText)` for line-range queries | Embedding the raw diff loses structural precision; line-range query is free and exact |
| Forget to register new Inngest functions | Add to the `functions` array in `src/app/api/inngest/route.ts` | Inngest won't know about the function and events will be silently dropped |

---

## Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| Page files | `page.tsx` in route folder | `src/app/dashboard/billing/page.tsx` |
| API routes | `route.ts` with HTTP method exports | `src/app/api/stripe/webhook/route.ts` |
| Server actions files | `actions.ts` in feature folder | `src/app/dashboard/actions.ts` |
| React components | PascalCase, `.tsx` extension | `RepoPicker.tsx`, `BrandVoiceForm.tsx` |
| Library modules | camelCase, `.ts` extension | `src/lib/db/release-drafts.ts` |
| Database tables | snake_case plural | `users`, `projects`, `release_drafts`, `brand_examples` |
| Database columns | snake_case | `user_id`, `github_repo_id`, `ai_content` |
| TypeScript types | PascalCase | `User`, `Project`, `ReleaseDraft`, `BrandExample` |
| Environment vars | SCREAMING_SNAKE_CASE | `STRIPE_SECRET_KEY`, `GITHUB_APP_ID` |
| Inngest functions | kebab-case ID | `{ id: "process-push" }` |
| Inngest events | namespace/action | `"github/push"` |
| CSS | Tailwind utility classes | Standard Tailwind conventions |

---

## Context Loading Strategy

| Task Type | Load First | Then If Needed |
|-----------|------------|----------------|
| **Understand the project** | `package.json`, `instructions.md`, `instructionsV2.md` | `src/app/page.tsx`, `src/app/dashboard/page.tsx` |
| **Add a new page** | `src/auth.ts`, `src/app/dashboard/page.tsx` | `src/lib/db/users.ts` for user queries |
| **Add API endpoint** | `src/app/api/webhooks/github/route.ts` (pattern example) | `src/lib/supabase/server.ts` |
| **Modify AI behavior** | `src/lib/ai/prompts.ts`, `src/lib/ai/generate.ts` | `src/inngest/functions/process-push.ts` |
| **Modify RAG / context retrieval** | `src/lib/github/context.ts`, `src/lib/github/chunker.ts`, `src/lib/db/repo-chunks.ts` | `src/inngest/functions/process-push.ts` (retrieve-context step) |
| **Modify repo indexing** | `src/inngest/functions/index-repo.ts`, `src/inngest/functions/update-embeddings.ts` | `src/lib/github/chunker.ts`, `src/lib/db/repo-chunks.ts` |
| **Change DB schema** | `supabase/migrations/*.sql` (all), `src/lib/db/types.ts` | Relevant `src/lib/db/*.ts` file |
| **Debug webhook flow** | `src/app/api/webhooks/github/route.ts` → `src/inngest/functions/process-push.ts` | `src/lib/github/webhook.ts`, `src/lib/db/projects.ts` |
| **Modify subscriptions** | `src/lib/subscription.ts`, `supabase/migrations/004_subscription_schema.sql` | `src/lib/stripe.ts`, `src/app/api/stripe/webhook/route.ts` |
| **Fix auth issues** | `src/auth.ts`, `src/lib/db/users.ts` | `src/app/signin/actions.ts`, `src/app/signup/actions.ts` |
| **Email changes** | `src/lib/email/resend.ts` | `src/inngest/functions/process-push.ts` (where emails sent) |
| **GitHub App integration** | `src/lib/github/app.ts`, `src/lib/github/webhook.ts` | `src/app/dashboard/github/callback/page.tsx` |
| **Brand voice feature** | `src/lib/db/brand-examples.ts`, `src/app/dashboard/settings/` | `src/lib/ai/prompts.ts` (few-shot injection) |

---

## Architecture Notes

**Request Flow (GitHub Push → Draft)**:
1. GitHub sends POST to `/api/webhooks/github`
2. Route verifies signature, parses payload, dispatches `github/push` event to Inngest
3. Inngest `process-push` function (RAG-enhanced pipeline):
   - finds project → fetches diffs → **checks significance (early exit for ~60-70% of pushes)**
   - fires `github/repo.files-changed` as non-blocking side-effect → `update-embeddings` keeps vector store fresh
   - **retrieve-context**: calls `getFileContext()` per changed file — line-range chunk query → GitHub file fetch → diff text → empty (4-level fallback); deleted files call `handleDeletedFile()` to purge stale chunks
   - **explain-commits**: single batched GPT call with changed function chunks + related chunks + `repo_summary` → plain-English explanation per commit
   - generates marketing content (changelog / LinkedIn / Twitter) with explanation-enriched context
   - creates draft (stores `commit_explanations` in `ai_content` JSONB) → sends email

**Repo Indexing Flow (on connect)**:
1. `connectRepo` action fires `github/repo.connected` event
2. `index-repo` Inngest function: fetches recursive repo tree → function-level chunks with `start_line`/`end_line`/`content_sha` → embeds via `text-embedding-3-small` → stores in `repo_file_chunks` (pgvector); also summarizes README → stores as `projects.repo_summary`

**Auth Flow**:
- NextAuth v5 handles session; stores user in JWT
- On first OAuth sign-in, `getOrCreateUser()` syncs to Supabase `users` table
- Credentials (email/password) use bcrypt, stored in `password_hash` column

**Subscription Tiers**:
- `free`: 1 repo, 3 drafts/month
- `founder`: unlimited repos, unlimited drafts ($19/mo)
- `team`: same as founder + team features (future)

---

## See also

| Doc | Use |
|-----|-----|
| [docs/decisions/](docs/decisions/README.md) | Why architecture decisions were made |
| [docs/verification.md](docs/verification.md) | How to verify changes |
| [docs/review-protocol.md](docs/review-protocol.md) | PR review checklists |
| [.tours/](/.tours/README.md) | Interactive code flow walkthroughs |
| [docs/README.md](docs/README.md) | Documentation hub by category |
| [docs/INDEX.md](docs/INDEX.md) | "I need to…" intent lookup |
