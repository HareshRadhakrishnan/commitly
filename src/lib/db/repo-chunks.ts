import { supabaseAdmin } from "@/lib/supabase/server"

export type RepoChunk = {
  id?: string
  project_id: string
  file_path: string
  chunk_index: number
  content: string
  content_sha: string
  start_line: number
  end_line: number
  embedding?: number[]
}

export type RepoChunkRow = {
  id: string
  project_id: string
  file_path: string
  chunk_index: number
  content: string
  content_sha: string
  start_line: number
  end_line: number
}

/**
 * Finds all chunks for a file whose line range overlaps with any of the provided ranges.
 * Used to retrieve the exact function chunks that were modified in a diff.
 */
export async function queryChunksByLineRange(
  projectId: string,
  filePath: string,
  ranges: { start: number; end: number }[]
): Promise<RepoChunkRow[]> {
  if (ranges.length === 0) return []

  const results: RepoChunkRow[] = []

  for (const range of ranges) {
    const { data, error } = await supabaseAdmin
      .from("repo_file_chunks")
      .select("id, project_id, file_path, chunk_index, content, content_sha, start_line, end_line")
      .eq("project_id", projectId)
      .eq("file_path", filePath)
      .lte("start_line", range.end)
      .gte("end_line", range.start)

    if (!error && data) {
      for (const row of data) {
        if (!results.some((r) => r.id === row.id)) {
          results.push(row as RepoChunkRow)
        }
      }
    }
  }

  return results.sort((a, b) => a.chunk_index - b.chunk_index)
}

/**
 * Finds the top-k semantically related chunks across the whole project
 * using cosine similarity. Embedding must be a vector(512) array.
 */
export async function queryRelatedChunks(
  projectId: string,
  embedding: number[],
  limit = 3
): Promise<RepoChunkRow[]> {
  const { data, error } = await supabaseAdmin.rpc("match_repo_chunks", {
    p_project_id: projectId,
    p_embedding: embedding,
    p_limit: limit,
  })

  if (error || !data) return []
  return data as RepoChunkRow[]
}

/**
 * Deletes existing chunks for a file then inserts the new set.
 * Each chunk must include a pre-computed embedding vector.
 */
export async function upsertChunks(
  chunks: (RepoChunk & { embedding: number[] })[]
): Promise<void> {
  if (chunks.length === 0) return

  const fileGroups = new Map<string, typeof chunks>()
  for (const chunk of chunks) {
    const key = `${chunk.project_id}::${chunk.file_path}`
    if (!fileGroups.has(key)) fileGroups.set(key, [])
    fileGroups.get(key)!.push(chunk)
  }

  for (const [, group] of fileGroups) {
    const { project_id, file_path } = group[0]
    await deleteChunksForFile(project_id, file_path)
  }

  const { error } = await supabaseAdmin.from("repo_file_chunks").insert(
    chunks.map((c) => ({
      project_id: c.project_id,
      file_path: c.file_path,
      chunk_index: c.chunk_index,
      content: c.content,
      content_sha: c.content_sha,
      start_line: c.start_line,
      end_line: c.end_line,
      embedding: JSON.stringify(c.embedding),
    }))
  )

  if (error) throw error
}

/**
 * Removes all chunks for a single file within a project.
 * Called when a file is deleted or before re-indexing it.
 */
export async function deleteChunksForFile(
  projectId: string,
  filePath: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("repo_file_chunks")
    .delete()
    .eq("project_id", projectId)
    .eq("file_path", filePath)

  if (error) throw error
}

/**
 * Removes all chunks for an entire project.
 * Called before a full re-index on initial connect.
 */
export async function deleteChunksForProject(projectId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("repo_file_chunks")
    .delete()
    .eq("project_id", projectId)

  if (error) throw error
}

/**
 * Returns the existing content_sha values for all chunks of a file.
 * Used to detect whether re-embedding is needed (SHA cache check).
 */
export async function getChunkShasForFile(
  projectId: string,
  filePath: string
): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("repo_file_chunks")
    .select("content_sha")
    .eq("project_id", projectId)
    .eq("file_path", filePath)
    .order("chunk_index", { ascending: true })

  if (error || !data) return []
  return data.map((r) => r.content_sha)
}
