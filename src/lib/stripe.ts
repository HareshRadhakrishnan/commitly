import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

export const stripe =
  process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string | null> {
  if (!stripe) return null;

  let customerId: string | null = null;
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (user?.stripe_customer_id) {
    customerId = user.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { user_id: userId },
    });
    customerId = customer.id;
    await supabaseAdmin
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  if (!customerId) return null;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { user_id: userId },
    subscription_data: {
      metadata: { user_id: userId },
    },
  });

  return session.url;
}

export async function createCustomerPortalSession(
  userId: string,
  returnUrl: string
): Promise<string | null> {
  if (!stripe) return null;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (!user?.stripe_customer_id) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: returnUrl,
  });

  return session.url;
}
