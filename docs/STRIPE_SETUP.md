# Stripe Setup (Phase 2b)

## 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Use Stripe Dashboard → Developers → API keys for test/live keys

## 2. Create Product & Price

1. Stripe Dashboard → Products → Add product
2. Name: **Founder (Pro)**
3. Price: $19/month, recurring
4. Copy the **Price ID** (e.g. `price_xxx`) → set as `STRIPE_PRICE_FOUNDER`

## 3. Create Customer Portal (optional)

For "Manage subscription" to work:

1. Stripe Dashboard → Settings → Billing → Customer portal
2. Enable subscription cancellation, plan changes, etc.

## 4. Webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-domain.com/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`

## 5. Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_xxx   # or sk_test_xxx for dev
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_FOUNDER=price_xxx
```

## 6. Local Webhook Testing

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then use the webhook secret printed in the terminal for `STRIPE_WEBHOOK_SECRET` in `.env.local`.
