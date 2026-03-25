# ADR-0007: Stripe Checkout + webhooks

## Status

Accepted (retroactive)

## Context

Commitly AI has subscription tiers (free, founder, team) with different limits. Payment processing needed to:
- Accept credit card payments
- Manage recurring subscriptions
- Update user tier on payment events

*Inferred from code as of 2026-03-23:* `src/lib/stripe.ts` creates Checkout Sessions and Customer Portal sessions. `src/app/api/stripe/webhook/route.ts` handles subscription lifecycle events.

## Decision

Use **Stripe Checkout** for payment collection and **Stripe Webhooks** for subscription state sync:
- Checkout Session created with `user_id` in metadata
- Webhook handles `checkout.session.completed`, `customer.subscription.created/updated/deleted`
- `users.subscription_tier` updated based on subscription status

Store `stripe_customer_id` and `stripe_subscription_id` on `users` table.

## Consequences

**Positive:**
- Hosted checkout page (no PCI compliance burden)
- Customer Portal for self-service subscription management
- Webhook-driven state sync is reliable

**Negative / Trade-offs:**
- Must handle webhook signature verification correctly
- `user_id` in metadata must be set on both session and subscription
- Tier logic duplicated in webhook handler and `subscription.ts`

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| Stripe Elements (embedded) | More work; Checkout sufficient for MVP |
| LemonSqueezy | Less ecosystem; Stripe well-known |
| Paddle | Similar; Stripe team familiarity |
| Manual invoicing | Doesn't scale; no self-service |

## Relevant Files

- `src/lib/stripe.ts` — `createCheckoutSession`, `createCustomerPortalSession`
- `src/app/api/stripe/checkout/route.ts` — initiates checkout
- `src/app/api/stripe/portal/route.ts` — initiates portal
- `src/app/api/stripe/webhook/route.ts` — handles Stripe events
- `src/lib/subscription.ts` — tier limits logic
- `supabase/migrations/004_subscription_schema.sql` — `subscription_tier`, `stripe_*` columns
- `docs/STRIPE_SETUP.md` — setup instructions
