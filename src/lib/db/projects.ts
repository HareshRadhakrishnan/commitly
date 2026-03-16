import { supabaseAdmin } from "@/lib/supabase/server";

export async function getProjectByRepoId(githubRepoId: number) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, user_id, github_repo_id, repo_name")
    .eq("github_repo_id", githubRepoId)
    .single();

  if (error || !data) return null;
  return data;
}
