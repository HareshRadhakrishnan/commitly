import { supabaseAdmin } from "@/lib/supabase/server";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getDraftCountForUserThisMonth(userId: string): Promise<number> {
  const month = currentMonth();
  const { data, error } = await supabaseAdmin
    .from("usage_records")
    .select("draft_count")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (error || !data) return 0;
  return data.draft_count ?? 0;
}

export async function incrementDraftCount(userId: string): Promise<void> {
  const month = currentMonth();
  const { data: existing } = await supabaseAdmin
    .from("usage_records")
    .select("id, draft_count")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("usage_records")
      .update({
        draft_count: (existing.draft_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("usage_records").insert({
      user_id: userId,
      month,
      draft_count: 1,
    });
  }
}
