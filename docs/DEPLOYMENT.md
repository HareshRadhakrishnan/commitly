# Commitly AI Deployment Guide

## Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables (see below)
4. Deploy

## Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Random string for session encryption. Generate: `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Yes* | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes* | Google OAuth client secret |
| `AUTH_GITHUB_ID` | Yes* | GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | Yes* | GitHub OAuth client secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `GITHUB_WEBHOOK_SECRET` | Yes | Webhook secret from GitHub App |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `RESEND_API_KEY` | Yes | Resend API key |
| `RESEND_FROM` | No | Sender email (e.g. `Commitly AI <notifications@yourdomain.com>`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Your deployed URL (e.g. `https://your-app.vercel.app`) |
| `AUTH_TRUST_HOST` | Yes | Set to `true` for Vercel |

*At least one OAuth provider (Google or GitHub) plus Credentials (email/password) for auth.

## Post-Deploy Checklist

1. **OAuth callbacks:** Update Google and GitHub OAuth apps with your production callback URLs:
   - `https://your-app.vercel.app/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/github`

2. **GitHub webhook:** Update your webhook URL to `https://your-app.vercel.app/api/webhooks/github`

3. **Inngest:** For production, use [Inngest Cloud](https://app.inngest.com):
   - Sign up at app.inngest.com
   - Add your app and get the event key
   - Set `INNGEST_EVENT_KEY` in Vercel env vars
   - Inngest will discover your functions at `https://your-app.vercel.app/api/inngest`
