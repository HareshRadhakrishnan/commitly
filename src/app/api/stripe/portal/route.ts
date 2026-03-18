import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrCreateUser } from "@/lib/db/users";
import { createCustomerPortalSession } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const authId = session.user.id ?? session.user.email;
  if (!authId) {
    return NextResponse.json({ error: "No user id" }, { status: 400 });
  }

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const url = await createCustomerPortalSession(
    dbUser.id,
    `${baseUrl}/dashboard/billing`
  );

  if (!url) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 400 }
    );
  }

  return NextResponse.json({ url });
}
