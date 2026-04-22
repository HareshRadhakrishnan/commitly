import { inngest } from "../client"
import { generateText, embedMany } from "ai"
import { openai } from "@ai-sdk/openai"
import {
  fetchRepoTree,
  fetchFileContent,
} from "@/lib/github/app"
import { chunkFile } from "@/lib/github/chunker"
import {
  upsertChunks,
  deleteChunksForProject,
} from "@/lib/db/repo-chunks"
import { buildImportGraph, formatCodeGraph } from "@/lib/github/tree-sitter/graph"
import { updateCodeGraph } from "@/lib/db/projects"
import { supabaseAdmin } from "@/lib/supabase/server"

type IndexRepoEventData = {
  project_id: string
  repo_full_name: string
  installation_id: number
}

const MAX_FILES = 150
const EMBED_BATCH_SIZE = 100  // OpenAI embedMany batch limit

export const indexRepo = inngest.createFunction(
  { id: "index-repo", concurrency: { limit: 5 } },
  { event: "github/repo.connected" },
  async ({ event, step }) => {
    const { project_id, repo_full_name, installation_id } =
      event.data as IndexRepoEventData

    // Step 1: fetch the full recursive file tree and filter to indexable files
    const treeEntries = await step.run("fetch-tree", async () => {
      const headSha = await getDefaultBranchSha(repo_full_name, installation_id)
      if (!headSha) return []
      return fetchRepoTree(repo_full_name, installation_id, headSha)
    })

    if (treeEntries.length === 0) {
      return { skipped: true, reason: "no indexable files found" }
    }

    const filesToIndex = treeEntries.slice(0, MAX_FILES)

    // Step 2: fetch content for each file, split into chunks, and collect raw
    // file content for TS/JS/TSX files (needed for import graph building).
    const { allChunks, graphFiles } = await step.run("fetch-and-chunk", async () => {
      const chunks: {
        project_id: string
        file_path: string
        chunk_index: number
        content: string
        content_sha: string
        start_line: number
        end_line: number
      }[] = []

      // Only pass TS/JS/TSX content to the graph builder — keeps the Inngest
      // step payload small while still covering all import-graph-relevant files.
      const GRAPH_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"])
      const graphFiles: { path: string; content: string }[] = []

      for (const entry of filesToIndex) {
        const content = await fetchFileContent(
          repo_full_name,
          installation_id,
          entry.path,
          "HEAD"
        )
        if (!content) continue

        const ext = entry.path.slice(entry.path.lastIndexOf(".")).toLowerCase()
        if (GRAPH_EXTENSIONS.has(ext)) {
          graphFiles.push({ path: entry.path, content })
        }

        const fileChunks = await chunkFile(content, entry.path)
        for (const chunk of fileChunks) {
          chunks.push({
            project_id,
            file_path: entry.path,
            chunk_index: chunk.chunkIndex,
            content: chunk.content,
            content_sha: chunk.contentSha,
            start_line: chunk.startLine,
            end_line: chunk.endLine,
          })
        }
      }

      return { allChunks: chunks, graphFiles }
    })

    if (allChunks.length === 0) {
      return { skipped: true, reason: "no chunks produced" }
    }

    // Step 3: embed all chunks and store in pgvector
    await step.run("embed-chunks", async () => {
      await deleteChunksForProject(project_id)

      for (let i = 0; i < allChunks.length; i += EMBED_BATCH_SIZE) {
        const batch = allChunks.slice(i, i + EMBED_BATCH_SIZE)
        const { embeddings } = await embedMany({
          model: openai.embedding("text-embedding-3-small"),
          values: batch.map((c) => c.content),
        })

        await upsertChunks(
          batch.map((c, idx) => ({ ...c, embedding: embeddings[idx] }))
        )
      }
    })

    // Step 4: build import graph from collected TS/JS/TSX file contents
    await step.run("build-code-graph", async () => {
      if (graphFiles.length === 0) return

      const graph = await buildImportGraph(graphFiles)
      await updateCodeGraph(project_id, graph)
    })

    // Step 5: fetch README and generate an architecture-aware repo summary
    await step.run("generate-architecture-summary", async () => {
      const readmeContent = await fetchFileContent(
        repo_full_name,
        installation_id,
        "README.md",
        "HEAD"
      )

      // Fetch the stored graph to include in the prompt (written in step 4)
      const { data: projectRow } = await supabaseAdmin
        .from("projects")
        .select("code_graph")
        .eq("id", project_id)
        .maybeSingle()

      const graph = projectRow?.code_graph ?? null
      const graphBlock = graph ? `\n\nCode structure:\n${formatCodeGraph(graph as Parameters<typeof formatCodeGraph>[0])}` : ""
      const readmeBlock = readmeContent
        ? `\n\nREADME:\n${readmeContent.slice(0, 3000)}`
        : ""

      if (!readmeBlock && !graphBlock) return

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are summarizing a software repository for an AI system that will later use this summary to understand code changes.

Write 3-5 sentences that cover:
1. What the app does and who uses it
2. Its key entry points (API routes, background jobs, UI pages)
3. Its most-depended-on internal modules and what they handle
4. The tech stack

Be specific about the actual code structure, not just the product description.${readmeBlock}${graphBlock}`,
        maxOutputTokens: 250,
      })

      await supabaseAdmin
        .from("projects")
        .update({ repo_summary: text.trim() })
        .eq("id", project_id)
    })

    return {
      success: true,
      project_id,
      files_indexed: filesToIndex.length,
      chunks_embedded: allChunks.length,
    }
  }
)

async function getDefaultBranchSha(
  repoFullName: string,
  installationId: number
): Promise<string | null> {
  const { getInstallationToken } = await import("@/lib/github/app")
  const [owner, repo] = repoFullName.split("/", 2)
  if (!owner || !repo) return null

  try {
    const token = await getInstallationToken(installationId)
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    )
    if (!res.ok) return null
    const data = (await res.json()) as { default_branch?: string }
    const branch = data.default_branch ?? "main"

    const refRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${branch}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    )
    if (!refRes.ok) return null
    const refData = (await refRes.json()) as { object?: { sha?: string } }
    return refData.object?.sha ?? null
  } catch {
    return null
  }
}
