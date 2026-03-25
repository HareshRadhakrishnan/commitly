# Phase 4: Email & Review UI Setup

## Environment variables

Add to `.env.local`:

```
RESEND_API_KEY=re_...
RESEND_FROM=Commitly AI <onboarding@resend.dev>   # Optional. For testing, use onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000     # Your app URL (for email links). Use ngrok URL when testing webhooks.
```

## Resend setup

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. For testing: use `onboarding@resend.dev` as the sender (Resend allows this for testing to your own email)
4. For production: verify your domain in Resend and set `RESEND_FROM` to e.g. `Commitly AI <notifications@yourdomain.com>`

## Flow

1. Push significant commit → Webhook → Inngest
2. Inngest: significance filter → generate content → create draft → send email
3. User receives email with "Review your generated notes" link
4. Link goes to `/dashboard/review/[draftId]`
5. User sees Before (commits) and After (changelog, LinkedIn, Twitter) with copy buttons
