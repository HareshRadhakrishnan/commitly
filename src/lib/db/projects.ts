import { supabaseAdmin } from "@/lib/supabase/server"
import type { ImportGraph } from "@/lib/github/tree-sitter/graph"

export async function getProjectByRepoId(githubRepoId: number) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, user_id, github_repo_id, repo_name, repo_summary, code_graph, github_installation_id")
    .eq("github_repo_id", githubRepoId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as typeof data & { code_graph: ImportGraph | null }
}

/**
 * Persists the import graph computed during repo indexing.
 * Called from the build-code-graph Inngest step.
 */
export async function updateCodeGraph(
  projectId: string,
  codeGraph: ImportGraph,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("projects")
    .update({ code_graph: codeGraph })
    .eq("id", projectId)

  if (error) throw error
}
