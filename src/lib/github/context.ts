import { fetchFileContent } from "@/lib/github/app"
import {
  queryChunksByLineRange,
  deleteChunksForFile,
} from "@/lib/db/repo-chunks"
import { parseHunkRanges } from "@/lib/github/chunker"

/**
 * Resolves the best available context for a single changed file using a
 * four-level fallback cascade:
 *
 *   Level 1 — Line-range chunk query (ideal: returns exact function chunks from vector store)
 *   Level 2 — Full file fetch from GitHub API (fallback for new/unindexed files)
 *   Level 3 — Diff text only (always available, zero extra cost)
 *   Level 4 — Empty string (caller uses commit message only)
 *
 * The function also skips retrieval entirely for deleted files, delegating to
 * handleDeletedFile() instead.
 */
export async function getFileContext(opts: {
  projectId: string
  filePath: string
  diffText: string
  repoFullName: string
  installationId: number
  sha: string
}): Promise<string> {
  const { projectId, filePath, diffText, repoFullName, installationId, sha } = opts

  // Parse hunk ranges from the diff to find which lines changed
  const ranges = parseHunkRanges(diffText)

  if (ranges.length > 0) {
    // Level 1: query vector store by line-range overlap
    const chunks = await queryChunksByLineRange(projectId, filePath, ranges)
    if (chunks.length > 0) {
      return chunks.map((c) => `// ${c.file_path} (lines ${c.start_line}–${c.end_line})\n${c.content}`).join("\n\n")
    }
  }

  // Level 2: fetch full file from GitHub API (handles new/unindexed files)
  const fileContent = await fetchFileContent(repoFullName, installationId, filePath, sha)
  if (fileContent) {
    return fileContent.slice(0, 2000)
  }

  // Level 3: diff text is always available at no extra cost
  if (diffText) {
    return diffText
  }

  // Level 4: no context available — caller falls back to commit message only
  return ""
}

/**
 * Handles a deleted file by removing its chunks from the vector store.
 * No retrieval or embedding is needed — the file no longer exists.
 *
 * Call this when CommitFile.status === 'removed'.
 */
export async function handleDeletedFile(
  projectId: string,
  filePath: string
): Promise<void> {
  await deleteChunksForFile(projectId, filePath)
}
