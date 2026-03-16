import { supabaseAdmin } from "@/lib/supabase/server";

export type CreateReleaseDraftInput = {
  project_id: string;
  ai_content: {
    changelog?: string;
    linkedin?: string;
    twitter?: string[];
    original_commits?: { id: string; message: string }[];
  };
  commit_shas: string[];
};

export async function createReleaseDraft(input: CreateReleaseDraftInput) {
  const { data, error } = await supabaseAdmin
    .from("release_drafts")
    .insert({
      project_id: input.project_id,
      ai_content: input.ai_content,
      commit_shas: input.commit_shas,
      status: "pending",
    })
    .select("id, project_id, ai_content, status, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function countRecentDraftsForProject(
  projectId: string,
  withinMinutes: number = 60
): Promise<number> {
  const since = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from("release_drafts")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .gte("created_at", since);

  if (error) return 0;
  return count ?? 0;
}

export async function getReleaseDraftById(draftId: string) {
  const { data, error } = await supabaseAdmin
    .from("release_drafts")
    .select(`
      id,
      project_id,
      ai_content,
      status,
      commit_shas,
      created_at,
      projects (
        id,
        repo_name,
        user_id
      )
    `)
    .eq("id", draftId)
    .single();

  if (error || !data) return null;
  return data;
}
