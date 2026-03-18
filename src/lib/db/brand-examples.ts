import { supabaseAdmin } from "@/lib/supabase/server";
import type { BrandExample } from "./types";

export async function getBrandExamplesForUser(userId: string): Promise<BrandExample[]> {
  const { data, error } = await supabaseAdmin
    .from("brand_examples")
    .select("id, user_id, content, platform, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as BrandExample[];
}

export async function createBrandExample(
  userId: string,
  platform: BrandExample["platform"],
  content: string
): Promise<BrandExample> {
  const { data, error } = await supabaseAdmin
    .from("brand_examples")
    .insert({ user_id: userId, platform, content: content.trim() })
    .select("id, user_id, content, platform, created_at")
    .single();

  if (error) throw error;
  return data as BrandExample;
}

export async function deleteBrandExample(id: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("brand_examples")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function countBrandExamplesForUser(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("brand_examples")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}
