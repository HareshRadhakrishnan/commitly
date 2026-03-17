# GitHub App Setup (Phase 2a – Repository Discovery)

The GitHub App enables users to connect repositories with one click instead of manually entering Repo IDs.

## 1. Create a GitHub App

1. Go to [GitHub Developer Settings](https://github.com/settings/apps) → **New GitHub App**
2. **Name:** Commitly (or your app name)
3. **Homepage URL:** `https://your-domain.com` (or `http://localhost:3000` for dev)
4. **Callback URL:** Leave empty (we use Setup URL)
5. **Setup URL:** `https://your-domain.com/dashboard/github/callback` (or `http://localhost:3000/dashboard/github/callback` for dev with ngrok)
6. **Webhook:**
   - **Active:** ✓
   - **Webhook URL:** `https://your-domain.com/api/webhooks/github`
   - **Secret:** Same as `GITHUB_WEBHOOK_SECRET`
7. **Permissions:**
   - Repository → Contents: **Read**
   - Repository → Metadata: **Read** (automatic)
8. **Subscribe to events:** Push 
9. **Where can this app be installed?** Any account
10. Create the app

## 2. Generate credentials

1. **App ID:** Settings → About (or General) – copy the App ID
2. **Client ID:** Same page – for reference
3. **Client secret:** Generate one (for OAuth if needed later)
4. **Private key:** Generate a private key – download the `.pem` file

## 3. Environment variables

Add to `.env.local`:

```
GITHUB_APP_ID=123456
GITHUB_APP_SLUG=commitly
GITHUB_APP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...your key content...
-----END PRIVATE KEY-----"
```

**Important:** For `GITHUB_APP_PRIVATE_KEY`, paste the full PEM content including the header and footer. Use quotes and preserve newlines (or replace them with `\n` in the string).

## 4. Webhook vs GitHub App

- **Repository webhook:** Sends events for one repo. You configure it per repo.
- **GitHub App:** When installed, it receives events for all repos the user selected. The webhook payload includes `installation.id`.

If you were using a repository webhook before, you can switch to a GitHub App. The webhook endpoint stays the same; the payload structure is compatible (both include `repository`, `commits`, etc.). The App adds `installation` to the payload.

## 5. Flow

1. User clicks "Connect GitHub" on dashboard
2. Redirects to `https://github.com/apps/commitly/installations/new`
3. User selects account/org and repos
4. GitHub redirects to your Setup URL with `?installation_id=xxx`
5. Callback saves installation to DB, redirects to dashboard
6. Dashboard fetches repos via GitHub API and shows Connect/Disconnect buttons
