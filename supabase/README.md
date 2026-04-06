# Supabase Setup

## 1. Run the migrations

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Open **SQL Editor** → **New query**
4. Run each migration in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_add_password_auth.sql` (adds `password_hash` for email/password login)
   - `migrations/003_github_app_schema.sql` (GitHub App installations + `projects` columns)
   - `migrations/004_subscription_schema.sql` (subscription tiers)
   - `migrations/005_brand_examples.sql` (brand voice examples)
   - `migrations/006_repo_context.sql` (pgvector extension + `repo_file_chunks` table + `repo_summary` on projects — required for RAG context pipeline)

## 2. Environment variables

Add to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Recommended for server-side
```

The **service role key** is in: Dashboard → Settings → API → `service_role` (secret).
Use it for server-side DB access. Never expose it to the client.
