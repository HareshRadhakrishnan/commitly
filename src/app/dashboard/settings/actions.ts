"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/db/users";
import {
  createBrandExample,
  deleteBrandExample,
  countBrandExamplesForUser,
} from "@/lib/db/brand-examples";
import type { BrandExample } from "@/lib/db/types";

const MAX_EXAMPLES_PER_PLATFORM = 5;

export async function addBrandExample(
  platform: BrandExample["platform"],
  content: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");

  const trimmed = content.trim();
  if (!trimmed) return { error: "Example cannot be empty." };
  if (trimmed.length < 20) return { error: "Example is too short (min 20 characters)." };
  if (trimmed.length > 3000) return { error: "Example is too long (max 3000 characters)." };

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");
  const total = await countBrandExamplesForUser(dbUser.id);

  if (total >= MAX_EXAMPLES_PER_PLATFORM * 3) {
    return { error: "You've reached the maximum of 15 brand examples total." };
  }

  await createBrandExample(dbUser.id, platform, trimmed);
  revalidatePath("/dashboard/settings");
  return {};
}

export async function removeBrandExample(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  await deleteBrandExample(id, dbUser.id);
  revalidatePath("/dashboard/settings");
  return {};
}
