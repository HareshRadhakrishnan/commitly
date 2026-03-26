import { supabaseAdmin } from "@/lib/supabase/server";

export async function getProjectByRepoId(githubRepoId: number) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, user_id, github_repo_id, repo_name, github_installation_id")
    .eq("github_repo_id", githubRepoId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
