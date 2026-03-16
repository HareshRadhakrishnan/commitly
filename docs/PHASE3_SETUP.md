# Phase 3: AI Pipeline Setup

## Prerequisites

- Phase 1 & 2 complete (Auth, DB, Webhook)
- OpenAI API key

## Environment variables

Add to `.env.local`:

```
OPENAI_API_KEY=sk-...
```

## Connect a repo

1. Go to **Dashboard** → **Connect a repo**
2. Get your repo ID:
   - Visit `https://api.github.com/repos/OWNER/REPO` (e.g. `https://api.github.com/repos/octocat/Hello-World`)
   - The `id` field is your repo ID
   - Or check the webhook payload when you push
3. Enter **Repo ID** and **owner/repo** (e.g. `123456` and `owner/repo`)
4. Click **Connect repo**

## Run Inngest (local dev)

Inngest processes the AI pipeline in the background. Run it alongside Next.js:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npx inngest-cli@latest dev
```

Then open http://localhost:8288 to see Inngest's dev UI and function runs.

## Test the pipeline

1. Connect your repo in the dashboard
2. Ensure webhook is configured (see GITHUB_WEBHOOK_SETUP.md)
3. Push a significant commit (e.g. "Add user authentication")
4. Check Inngest UI for the run
5. Check Supabase `release_drafts` table for the generated content
