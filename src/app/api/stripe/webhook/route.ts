import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe/webhook] Stripe not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (!userId) break;

      const tier = sub.status === "active" ? "founder" : "free";
      await supabaseAdmin
        .from("users")
        .update({
          subscription_tier: tier,
          stripe_subscription_id: sub.id,
        })
        .eq("id", userId);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (!userId) break;

      await supabaseAdmin
        .from("users")
        .update({
          subscription_tier: "free",
          stripe_subscription_id: null,
        })
        .eq("id", userId);
      break;
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId || session.mode !== "subscription") break;

      const subscriptionId = session.subscription as string;
      if (!subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      await supabaseAdmin
        .from("users")
        .update({
          subscription_tier: "founder",
          stripe_subscription_id: sub.id,
        })
        .eq("id", userId);
      break;
    }
    default:
      // Ignore other events
      break;
  }

  return NextResponse.json({ received: true });
}
