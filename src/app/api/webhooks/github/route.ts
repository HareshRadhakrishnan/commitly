import { NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  parsePushPayload,
} from "@/lib/github/webhook";

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] GITHUB_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event !== "push") {
    return NextResponse.json({ received: true });
  }

  let payload: unknown;
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawBody);
      const payloadStr = params.get("payload");
      if (!payloadStr) {
        return NextResponse.json(
          { error: "Missing payload in form data" },
          { status: 400 }
        );
      }
      payload = JSON.parse(payloadStr);
    } else {
      payload = JSON.parse(rawBody);
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pushData = parsePushPayload(payload);
  if (!pushData) {
    return NextResponse.json({ error: "Invalid push payload" }, { status: 400 });
  }

  if (pushData.commits.length === 0) {
    return NextResponse.json({ received: true, skipped: "no commits" });
  }

  const { inngest } = await import("@/inngest/client");
  await inngest.send({
    name: "github/push",
    data: {
      repository: pushData.repository,
      commits: pushData.commits,
    },
  });

  return NextResponse.json({
    received: true,
    repo: pushData.repository.full_name,
    commits: pushData.commits.length,
  });
}
