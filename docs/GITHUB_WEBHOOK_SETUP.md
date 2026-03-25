# GitHub Webhook Setup

## 1. Create a GitHub App (or Repository Webhook)

### Option A: GitHub App (recommended for multi-repo)

1. Go to [GitHub Developer Settings](https://github.com/settings/apps) → **New GitHub App**
2. **Name:** Commitly AI (or your choice)
3. **Homepage URL:** `http://localhost:3000` (or your deployed URL)
4. **Webhook:**
   - **Active:** ✓
   - **Webhook URL:** `https://your-domain.com/api/webhooks/github` (use ngrok for local: `https://xxx.ngrok.io/api/webhooks/github`)
   - **Secret:** Generate a random string (e.g. `openssl rand -hex 32`)
5. **Permissions:**
   - Repository → Contents: **Read**
   - Repository → Webhooks: **Read**
6. **Subscribe to events:** Push
7. Create the app, then install it on your repos

### Option B: Repository Webhook (single repo)

1. Go to your repo → **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL:** `https://your-domain.com/api/webhooks/github`
3. **Content type:** `application/json`
4. **Secret:** Generate a random string
5. **Events:** Just the push event
6. Add webhook

## 2. Environment variables

Add to `.env.local`:

```
GITHUB_WEBHOOK_SECRET=your-webhook-secret-from-step-1
OPENAI_API_KEY=your-openai-api-key  # For AI significance filter + content generation
```

## 3. Local testing with ngrok

**GitHub cannot reach localhost.** If you're running locally, GitHub has no way to send webhooks to your machine. You must use ngrok (or similar):

```bash
ngrok http 3000
```

Then set your webhook URL to `https://<ngrok-id>.ngrok.io/api/webhooks/github`.

## 4. Troubleshooting: No Inngest events?

1. **Is the webhook reaching your app?**  
   Check GitHub: Repo → Settings → Webhooks → your webhook → **Recent Deliveries**.  
   - Green check = delivered. Red X = failed (often because GitHub can't reach localhost).

2. **Using localhost?** You need ngrok. GitHub cannot POST to `http://localhost:3000`.

3. **Is Inngest dev server running?**  
   In a separate terminal: `npx inngest-cli@latest dev`  
   Open http://localhost:8288 to see the Inngest UI.

4. **Test without GitHub:**  
   Visit `http://localhost:3000/api/test-webhook` in your browser.  
   This sends a fake event to Inngest. If you see a run at http://localhost:8288, the pipeline works — the issue is webhook delivery.
