import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrCreateUser } from "@/lib/db/users";
import { createCheckoutSession } from "@/lib/stripe";

const PRICE_FOUNDER = process.env.STRIPE_PRICE_FOUNDER;

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!PRICE_FOUNDER) {
    return NextResponse.json(
      { error: "Billing not configured" },
      { status: 500 }
    );
  }

  const authId = session.user.id ?? session.user.email;
  if (!authId) {
    return NextResponse.json({ error: "No user id" }, { status: 400 });
  }

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const url = await createCheckoutSession(
    dbUser.id,
    dbUser.email,
    PRICE_FOUNDER,
    `${baseUrl}/dashboard?upgraded=1`,
    `${baseUrl}/dashboard/billing`
  );

  if (!url) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url });
}
