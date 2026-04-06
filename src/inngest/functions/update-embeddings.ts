import { inngest } from "../client"
import { embedMany, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { fetchFileContent } from "@/lib/github/app"
import { chunkFile } from "@/lib/github/chunker"
import {
  upsertChunks,
  deleteChunksForFile,
  getChunkShasForFile,
} from "@/lib/db/repo-chunks"
import { handleDeletedFile } from "@/lib/github/context"
import { supabaseAdmin } from "@/lib/supabase/server"

export type ChangedFile = {
  path: string
  status: "added" | "modified" | "removed" | "renamed" | string
  prefetchedContent?: string  // if already fetched in process-push, pass it through
}

type UpdateEmbeddingsEventData = {
  project_id: string
  repo_full_name: string
  installation_id: number
  head_sha: string
  changed_files: ChangedFile[]
}

const EMBED_BATCH_SIZE = 100

export const updateEmbeddings = inngest.createFunction(
  { id: "update-embeddings", concurrency: { limit: 10 } },
  { event: "github/repo.files-changed" },
  async ({ event, step }) => {
    const {
      project_id,
      repo_full_name,
      installation_id,
      head_sha,
      changed_files,
    } = event.data as UpdateEmbeddingsEventData

    // Step 1: handle deleted files — remove their chunks, nothing to embed
    const deletedFiles = changed_files.filter((f) => f.status === "removed")
    if (deletedFiles.length > 0) {
      await step.run("handle-deleted", async () => {
        await Promise.all(
          deletedFiles.map((f) => handleDeletedFile(project_id, f.path))
        )
      })
    }

    // Step 2: re-index modified and added files with SHA-based cache
    const changedFiles = changed_files.filter((f) => f.status !== "removed")
    if (changedFiles.length === 0) {
      return { success: true, skipped: true, reason: "only deletions" }
    }

    await step.run("reindex-changed", async () => {
      const chunksToEmbed: {
        project_id: string
        file_path: string
        chunk_index: number
        content: string
        content_sha: string
        start_line: number
        end_line: number
        embedding: number[]
      }[] = []

      for (const file of changedFiles) {
        const content =
          file.prefetchedContent ??
          (await fetchFileContent(repo_full_name, installation_id, file.path, head_sha))

        if (!content) {
          // Binary or inaccessible — remove stale chunks
          await deleteChunksForFile(project_id, file.path)
          continue
        }

        const chunks = chunkFile(content, file.path)
        if (chunks.length === 0) continue

        const newShas = chunks.map((c) => c.contentSha)
        const existingShas = await getChunkShasForFile(project_id, file.path)

        // SHA cache: skip re-embedding if all chunk content is identical
        const isCacheHit =
          newShas.length === existingShas.length &&
          newShas.every((sha, i) => sha === existingShas[i])

        if (isCacheHit) continue

        // Embed in batches
        for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
          const batch = chunks.slice(i, i + EMBED_BATCH_SIZE)
          const { embeddings } = await embedMany({
            model: openai.embedding("text-embedding-3-small"),
            values: batch.map((c) => c.content),
          })

          for (let j = 0; j < batch.length; j++) {
            chunksToEmbed.push({
              project_id,
              file_path: file.path,
              chunk_index: batch[j].chunkIndex,
              content: batch[j].content,
              content_sha: batch[j].contentSha,
              start_line: batch[j].startLine,
              end_line: batch[j].endLine,
              embedding: embeddings[j],
            })
          }
        }
      }

      if (chunksToEmbed.length > 0) {
        await upsertChunks(chunksToEmbed)
      }
    })

    // Step 3: if README changed, refresh the project's repo_summary
    const readmeChanged = changed_files.some(
      (f) => f.path === "README.md" && f.status !== "removed"
    )

    if (readmeChanged) {
      await step.run("update-readme-summary", async () => {
        const readmeContent = await fetchFileContent(
          repo_full_name,
          installation_id,
          "README.md",
          head_sha
        )
        if (!readmeContent) return

        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          prompt: `Summarize this repository in 2-3 sentences: what it does, who uses it, and its tech stack. Be concise and specific.\n\nREADME:\n${readmeContent.slice(0, 4000)}`,
          maxOutputTokens: 150,
        })

        await supabaseAdmin
          .from("projects")
          .update({ repo_summary: text.trim() })
          .eq("id", project_id)
      })
    }

    return { success: true, project_id, files_reindexed: changedFiles.length }
  }
)
