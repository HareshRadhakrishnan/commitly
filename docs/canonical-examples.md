<!-- last_verified: 2026-03-23 | verified_by: initial setup -->
<!-- staleness_trigger: any change to files listed in "Relevant Files" below -->

# Canonical Reference Implementations

> **TL;DR:** Every pattern in this codebase has ONE canonical file. Copy from these, not from adjacent variants.

---

## Quick Reference

### Canonical File Registry

| Pattern | Canonical File | Why This One |
|---------|----------------|--------------|
| Protected Page | `src/app/dashboard/settings/page.tsx` | Auth check + user lookup + data fetch; no own header (shell provides chrome) |
| API Route (authenticated) | `src/app/api/github/repos/route.ts` | Auth + user lookup + error handling |
| API Route (webhook) | `src/app/api/webhooks/github/route.ts` | Signature verification + Inngest dispatch |
| Server Action | `src/app/dashboard/settings/actions.ts` | Validation + auth + DB mutation + revalidate |
| DB Query Module | `src/lib/db/users.ts` | CRUD pattern with supabaseAdmin |
| Inngest Background Job | `src/inngest/functions/process-push.ts` | Multi-step with error handling |
| Client Component + Action | `src/app/dashboard/projects/RepoPicker.tsx` | Fetch + optimistic UI + server action |
| Email Template | `src/lib/email/resend.ts` | Inline HTML with Resend |

---

## Deep Dive

### 1. Protected Page (Server Component)

The canonical example is `src/app/dashboard/settings/page.tsx`. It shows the standard auth check, user lookup, and data fetching pattern. Note that **dashboard pages do not render their own header** — `src/app/dashboard/layout.tsx` wraps all children in `DashboardShell`, which provides the sidebar, top bar, and mobile Sheet.

**Skeleton:**

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/db/users";

export default async function MyPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  // Fetch page-specific data using dbUser.id
  // const myData = await getMyData(dbUser.id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Page content */}
    </div>
  );
}
```

---

### 2. API Route (Authenticated)

The canonical example is `src/app/api/github/repos/route.ts`. Shows auth check in API context.

**Skeleton:**

```ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db/users";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authId = session.user.id ?? session.user.email;
  if (!authId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  try {
    // Your logic here using dbUser.id
    return NextResponse.json({ data: "result" });
  } catch (err) {
    console.error("[api/my-route]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

---

### 3. API Route (Webhook with Signature Verification)

The canonical example is `src/app/api/webhooks/github/route.ts`. Shows signature check + Inngest dispatch.

**Skeleton:**

```ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.MY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-signature-header");
  const rawBody = await request.text();

  // Verify signature (implement your verification)
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // Dispatch to Inngest for background processing
  const { inngest } = await import("@/inngest/client");
  await inngest.send({
    name: "my-service/event-name",
    data: payload,
  });

  return NextResponse.json({ received: true });
}
```

---

### 4. Server Action

The canonical example is `src/app/dashboard/settings/actions.ts`. Shows validation + auth + mutation + revalidation.

**Skeleton:**

```ts
"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/db/users";

export async function myAction(
  inputParam: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");

  // Validate input
  const trimmed = inputParam.trim();
  if (!trimmed) return { error: "Input cannot be empty." };

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  // Perform mutation
  // await createSomething(dbUser.id, trimmed);

  revalidatePath("/dashboard/my-page");
  return {};
}
```

---

### 5. Database Query Module

The canonical example is `src/lib/db/users.ts`. Shows the supabaseAdmin pattern for CRUD.

**Skeleton:**

```ts
import { supabaseAdmin } from "@/lib/supabase/server";

export async function getMyEntityById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("my_table")
    .select("id, name, created_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function createMyEntity(userId: string, name: string) {
  const { data, error } = await supabaseAdmin
    .from("my_table")
    .insert({ user_id: userId, name })
    .select("id, name, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMyEntity(id: string, userId: string) {
  const { error } = await supabaseAdmin
    .from("my_table")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
```

---

### 6. Inngest Background Job

The canonical example is `src/inngest/functions/process-push.ts`. Shows multi-step processing.

**Skeleton:**

```ts
import { inngest } from "../client";

type MyEventData = {
  entityId: string;
  // ... other fields
};

export const myBackgroundJob = inngest.createFunction(
  { id: "my-job-name" },
  { event: "my-service/event-name" },
  async ({ event, step }) => {
    const { entityId } = event.data as MyEventData;

    // Step 1: Fetch data
    const entity = await step.run("fetch-entity", async () => {
      return getEntityById(entityId);
    });

    if (!entity) {
      return { skipped: true, reason: "entity not found" };
    }

    // Step 2: Process
    const result = await step.run("process", async () => {
      return doProcessing(entity);
    });

    // Step 3: Save result
    await step.run("save-result", async () => {
      return saveResult(entity.id, result);
    });

    return { success: true, entityId };
  }
);
```

**Register in `src/app/api/inngest/route.ts`:**

```ts
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { myBackgroundJob } from "@/inngest/functions/my-job";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [myBackgroundJob],
});
```

---

### 7. Client Component with Server Action

The canonical example is `src/app/dashboard/projects/RepoPicker.tsx`. Shows fetching + state + calling server actions.

**Skeleton:**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { myServerAction } from "../actions";
import { Loader2 } from "lucide-react";

type Props = {
  initialData: SomeType[];
};

export function MyClientComponent({ initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(initialData);
  const router = useRouter();

  async function handleAction(itemId: string) {
    setLoading(true);
    try {
      await myServerAction(itemId);
      router.refresh(); // Refresh server component data
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleAction(item.id)}
          disabled={loading}
          className="rounded-lg bg-amber-500 px-4 py-2 text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Action"}
        </button>
      ))}
    </div>
  );
}
```

---

### 8. Email Template

The canonical example is `src/lib/email/resend.ts`. Shows inline HTML email with Resend.

**Skeleton:**

```ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "App <onboarding@resend.dev>";

export async function sendMyEmail(to: string, actionUrl: string) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Your Subject Line",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 24px;">
    <span style="font-size: 24px; font-weight: 700; color: #f59e0b;">Commitly AI</span>
  </div>
  <h1 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px;">
    Your Heading
  </h1>
  <p style="margin: 0 0 24px; color: #6b7280;">
    Your message here.
  </p>
  <a href="${actionUrl}" style="display: inline-block; background: #f59e0b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
    Call to Action
  </a>
</body>
</html>
    `.trim(),
  });

  if (error) throw error;
  return data;
}
```

---

## Relevant Files

Changes to these files may make examples above stale:

- `src/auth.ts` — Auth configuration
- `src/lib/supabase/server.ts` — DB client
- `src/inngest/client.ts` — Inngest instance
- `src/lib/db/types.ts` — TypeScript types
