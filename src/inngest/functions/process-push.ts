import { inngest } from "../client"
import type { PushCommit } from "@/lib/github/webhook"
import type { CommitWithContext } from "@/lib/ai/prompts"
import { getProjectByRepoId } from "@/lib/db/projects"
import {
  createReleaseDraft,
  countRecentDraftsForProject,
} from "@/lib/db/release-drafts"
import { getUserById } from "@/lib/db/users"
import { getDraftCountForUserThisMonth, incrementDraftCount } from "@/lib/db/usage"
import { canCreateDraft } from "@/lib/subscription"
import { checkSignificance, classifyFiles, explainCommits, generateContent } from "@/lib/ai/generate"
import { sendDraftNotificationEmail } from "@/lib/email/resend"
import { fetchCommitDiff } from "@/lib/github/app"
import { getBrandExamplesForUser } from "@/lib/db/brand-examples"
import { getFileContext, handleDeletedFile } from "@/lib/github/context"
import { fetchFileContent } from "@/lib/github/app"
import { buildCommitDigest } from "@/lib/github/tree-sitter/digest"
import type { ImportGraph } from "@/lib/github/tree-sitter/graph"
import { embedMany } from "ai"
import { openai } from "@ai-sdk/openai"
import { queryRelatedChunks, getChunkShasForFile } from "@/lib/db/repo-chunks"
import type { ChangedFile } from "./update-embeddings"

type PushEventData = {
  repository: {
    id: number
    full_name: string
    name: string
  }
  commits: PushCommit[]
}

type CommitFile = {
  filename: string
  status: string
  additions: number
  deletions: number
  patch?: string
}

/**
 * Removes files that are never meaningful for a user-facing changelog:
 * lock files, env files, dotfiles, CI configs, and other pure infrastructure.
 *
 * Runs synchronously in fetch-diffs before any LLM call, so no token cost.
 */
const DENYLIST_EXACT = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  ".npmrc",
  ".nvmrc",
  "Dockerfile",
  "Makefile",
])

const DENYLIST_PATTERNS = [
  /\.env(\..+)?$/i,        // .env, .env.local, .env.example, etc.
  /\.example$/i,           // *.example
  /\.lock$/i,              // *.lock
  /docker-compose.*\.ya?ml$/i,
  /\.(prettierrc|eslintrc|babelrc|stylelintrc)(\..*)?$/i,
  /\.(cfg|ini|toml)$/i,
  /\.github\//i,           // GitHub Actions, dependabot, etc.
]

function filterByDenylist(files: CommitFile[]): CommitFile[] {
  return files.filter((f) => {
    const base = f.filename.split("/").pop() ?? f.filename
    if (DENYLIST_EXACT.has(base)) return false
    if (DENYLIST_PATTERNS.some((re) => re.test(f.filename))) return false
    return true
  })
}

const DIFF_CHARS_PER_FILE = 1000
const DIFF_FILES_PER_COMMIT = 5
const MAX_CONTEXT_FILES_PER_COMMIT = 3

export const processPush = inngest.createFunction(
  { id: "process-push" },
  { event: "github/push" },
  async ({ event, step }) => {
    const { repository, commits } = event.data as PushEventData

    if (commits.length === 0) {
      return { skipped: true, reason: "no commits" }
    }

    const project = await step.run("find-project", async () => {
      return getProjectByRepoId(repository.id)
    })

    if (!project) {
      return { skipped: true, reason: "repo not connected to Commitly AI" }
    }

    // ── Step 1: fetch diffs (lightweight — only patch text) ───────────────────
    const commitsWithContext = await step.run(
      "fetch-diffs",
      async (): Promise<CommitWithContext[]> => {
        const installationId = project.github_installation_id
        const hasInstallation = typeof installationId === "number"

        return Promise.all(
          commits.map(async (c): Promise<CommitWithContext> => {
            const base: CommitWithContext = { ...c }
            if (!hasInstallation) return base

            const detail = await fetchCommitDiff(
              repository.full_name,
              installationId,
              c.id
            )
            if (!detail?.files?.length) return base

            // Apply denylist before slicing — prevents config/env files from
            // occupying the limited DIFF_FILES_PER_COMMIT slots.
            const meaningfulFiles = filterByDenylist(detail.files as CommitFile[])

            base.changedFileDetails = meaningfulFiles.map((f) => ({
              filename: f.filename,
              status: f.status,
              additions: f.additions,
              deletions: f.deletions,
            }))

            const parts = meaningfulFiles
              .slice(0, DIFF_FILES_PER_COMMIT)
              .map((f) => {
                const patch = f.patch ?? ""
                const truncated =
                  patch.length > DIFF_CHARS_PER_FILE
                    ? patch.slice(0, DIFF_CHARS_PER_FILE) + "\n... (truncated)"
                    : patch
                return `--- ${f.filename} (${f.additions}+/${f.deletions}-) ---\n${truncated}`
              })
            base.diffText = parts.join("\n\n")
            return base
          })
        )
      }
    )

    // ── Step 2: significance check — EARLY EXIT for ~60-70% of pushes ────────
    const isSignificant = await step.run("check-significance", async () => {
      return checkSignificance(commitsWithContext, project.repo_summary ?? null)
    })

    if (!isSignificant) {
      // Fire embedding update as a side-effect even for insignificant pushes
      // so the index stays fresh for future significant ones.
      await fireEmbeddingUpdate(step, project, repository, commits, commitsWithContext)
      return { skipped: true, reason: "commits not significant" }
    }

    // ── Step 3: fire embedding update (non-blocking, runs in parallel) ───────
    await fireEmbeddingUpdate(step, project, repository, commits, commitsWithContext)

    // ── Step 3b: classify changed files by semantic relevance ────────────────
    // Asks gpt-4o-mini (with repo_summary + code_graph context) to label each
    // file as "core" | "support" | "infra". Only "core" files drive context
    // retrieval. Input is file paths + change counts only (~150-200 tokens).
    const codeGraph = (project.code_graph ?? null) as ImportGraph | null
    const commitsWithClassification = await step.run(
      "classify-files",
      async (): Promise<CommitWithContext[]> => {
        try {
          const categoryMap = await classifyFiles(
            commitsWithContext,
            project.repo_summary ?? null,
            codeGraph,
          )

          return commitsWithContext.map((commit) => {
            const coreFileNames = (commit.changedFileDetails ?? [])
              .filter((f) => {
                const cat = categoryMap.get(f.filename)
                // If classifier returned no result for this file, keep it (safe default)
                return cat === "core" || cat === undefined
              })
              .map((f) => f.filename)

            return { ...commit, coreFileNames }
          })
        } catch {
          // Non-fatal: fall back to all denylist-surviving files
          return commitsWithContext.map((commit) => ({
            ...commit,
            coreFileNames: (commit.changedFileDetails ?? []).map((f) => f.filename),
          }))
        }
      }
    )

    // ── Step 4: retrieve context for each commit using tiered fallback ────────
    const commitsWithRetrievedContext = await step.run(
      "retrieve-context",
      async (): Promise<CommitWithContext[]> => {
        const installationId = project.github_installation_id
        const hasInstallation = typeof installationId === "number"

        return Promise.all(
          commitsWithClassification.map(async (commit) => {
            const detail = await fetchCommitDiff(
              repository.full_name,
              hasInstallation ? installationId! : 0,
              commit.id
            ).catch(() => null)

            if (!detail?.files?.length) return commit

            // Handle deletions first — use the raw list so removed files are
            // always purged from the vector store, even if denylisted.
            if (hasInstallation) {
              await Promise.all(
                detail.files
                  .filter((f) => f.status === "removed")
                  .map((f) => handleDeletedFile(project.id, f.filename))
              )
            }

            // Re-apply denylist to the fresh diff response. The fetch-diffs step
            // already filtered changedFileDetails, but this is a second API call
            // that returns the raw file list again. Without this, denylisted files
            // re-enter the chunk-presence queries and contextFiles slot budget.
            const meaningfulDetailFiles = filterByDenylist(
              detail.files.filter((f) => f.status !== "removed") as CommitFile[]
            )

            // ── Rank files for context retrieval ─────────────────────────────
            // Priority order (highest first):
            //   1. Classified as "core" by the LLM classifier
            //      OR listed as a core module in the import graph (high centrality)
            //   2. Already indexed in repo_file_chunks (known code files)
            //   3. All other surviving files
            const graphCoreModulePaths = new Set(
              (codeGraph?.coreModules ?? []).map((m) => m.path)
            )
            const coreSet = new Set([
              ...(commit.coreFileNames ?? []),
              // Also elevate files the graph identifies as highly-imported
              ...meaningfulDetailFiles
                .filter((f) => graphCoreModulePaths.has(f.filename))
                .map((f) => f.filename),
            ])

            // Chunk-presence check: DB query per file, no embedding needed
            const chunkPresenceMap = new Map<string, boolean>()
            if (hasInstallation && project.id) {
              await Promise.all(
                meaningfulDetailFiles.map(async (f) => {
                  const shas = await getChunkShasForFile(project.id, f.filename).catch(() => [])
                  chunkPresenceMap.set(f.filename, shas.length > 0)
                })
              )
            }

            const rankFile = (f: { filename: string }) => {
              if (coreSet.has(f.filename)) return 0
              if (chunkPresenceMap.get(f.filename)) return 1
              return 2
            }

            const contextFiles = [...meaningfulDetailFiles]
              .sort((a, b) => rankFile(a) - rankFile(b))
              .slice(0, MAX_CONTEXT_FILES_PER_COMMIT)

            // Get context for each ranked file using tiered fallback
            const retrievedContext: { filePath: string; content: string }[] = []

            for (const file of contextFiles) {
              if (!hasInstallation) continue
              const content = await getFileContext({
                projectId: project.id,
                filePath: file.filename,
                diffText: file.patch ?? commit.diffText ?? "",
                repoFullName: repository.full_name,
                installationId: installationId!,
                sha: commit.id,
              })
              if (content) {
                retrievedContext.push({ filePath: file.filename, content })
              }
            }

            // Cosine similarity search for related chunks using the diff embedding
            if (commit.diffText && project.id) {
              try {
                const { embeddings } = await embedMany({
                  model: openai.embedding("text-embedding-3-small"),
                  values: [commit.diffText.slice(0, 1000)],
                })
                const relatedChunks = await queryRelatedChunks(project.id, embeddings[0], 3)
                for (const chunk of relatedChunks) {
                  const alreadyIncluded = retrievedContext.some(
                    (rc) => rc.filePath === chunk.file_path
                  )
                  if (!alreadyIncluded) {
                    retrievedContext.push({
                      filePath: chunk.file_path,
                      content: chunk.content,
                    })
                  }
                }
              } catch {
                // Non-fatal: continue without related chunks
              }
            }

            // ── Build structural digest using Tree-sitter CST ──────────────────
            // Fetch full file content for each non-deleted file (TS/JS/TSX only)
            // and map changed hunk ranges to top-level symbol names. This gives
            // the LLM precise "what changed" context at a fraction of the token
            // cost of a full diff or file fetch.
            let structuralDigest: string | undefined
            if (hasInstallation) {
              try {
                const digestFiles = await Promise.all(
                  contextFiles
                    .filter((f) => f.status !== "removed" && f.patch)
                    .slice(0, 4)
                    .map(async (f) => ({
                      filename: f.filename,
                      patch: f.patch ?? null,
                      content: await fetchFileContent(
                        repository.full_name,
                        installationId!,
                        f.filename,
                        commit.id,
                      ).catch(() => null),
                    }))
                )
                structuralDigest = await buildCommitDigest(digestFiles)
              } catch {
                // Non-fatal: digest is purely additive
              }
            }

            return { ...commit, retrievedContext, structuralDigest }
          })
        )
      }
    )

    // ── Step 5: generate plain-English explanations per commit ────────────────
    const commitsWithExplanations = await step.run(
      "explain-commits",
      async (): Promise<CommitWithContext[]> => {
        const explanations = await explainCommits(
          commitsWithRetrievedContext,
          project.repo_summary ?? null,
          codeGraph,
        )

        const explanationMap = new Map(explanations.map((e) => [e.sha, e.explanation]))

        return commitsWithRetrievedContext.map((c) => ({
          ...c,
          explanation: explanationMap.get(c.id.slice(0, 7)) ?? explanationMap.get(c.id),
        }))
      }
    )

    // ── Step 6: usage and limit checks ───────────────────────────────────────
    const user = await step.run("get-user", async () => {
      return getUserById(project.user_id)
    })

    const withinLimit = await step.run("check-usage-limit", async () => {
      const draftCount = await getDraftCountForUserThisMonth(project.user_id)
      return canCreateDraft(user?.subscription_tier, draftCount)
    })

    if (!withinLimit) {
      return { skipped: true, reason: "draft limit reached for this month" }
    }

    const brandExamples = await step.run("fetch-brand-examples", async () => {
      return getBrandExamplesForUser(project.user_id)
    })

    // ── Step 7: generate marketing content with full context ──────────────────
    const content = await step.run("generate-content", async () => {
      return generateContent(commitsWithExplanations, undefined, brandExamples)
    })

    // ── Step 8: persist draft ─────────────────────────────────────────────────
    const draft = await step.run("create-draft", async () => {
      const d = await createReleaseDraft({
        project_id: project.id,
        ai_content: {
          changelog: content.changelog,
          linkedin: content.linkedin,
          twitter: content.twitter,
          original_commits: commits.map((c) => ({ id: c.id, message: c.message })),
          commit_explanations: commitsWithExplanations
            .filter((c) => c.explanation)
            .map((c) => ({ sha: c.id.slice(0, 7), explanation: c.explanation! })),
          commit_digests: commitsWithExplanations
            .filter((c) => c.structuralDigest)
            .map((c) => ({ sha: c.id.slice(0, 7), digest: c.structuralDigest! })),
        },
        commit_shas: commits.map((c) => c.id),
      })
      await incrementDraftCount(project.user_id)
      return d
    })

    // ── Step 9: email notification ────────────────────────────────────────────
    const shouldSendEmail =
      user?.email &&
      process.env.RESEND_API_KEY &&
      (await step.run("check-email-rate-limit", async () => {
        const recentCount = await countRecentDraftsForProject(project.id, 60)
        return recentCount <= 1
      }))

    if (shouldSendEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      const reviewUrl = `${baseUrl}/dashboard/review/${draft.id}`

      await step.run("send-email", async () => {
        await sendDraftNotificationEmail(user!.email, reviewUrl, project.repo_name)
      })
    }

    return {
      success: true,
      draft_id: draft.id,
      project_id: project.id,
    }
  }
)

/**
 * Fires the github/repo.files-changed event as a non-blocking side-effect.
 * The update-embeddings function handles deleted files, SHA cache checks,
 * and re-embedding — keeping the vector store fresh for future pushes.
 */
async function fireEmbeddingUpdate(
  step: { run: (id: string, fn: () => Promise<unknown>) => Promise<unknown> },
  project: { id: string; github_installation_id: number | null },
  repository: { full_name: string },
  commits: PushCommit[],
  commitsWithContext: CommitWithContext[]
) {
  if (!project.github_installation_id) return

  const headSha = commits[commits.length - 1]?.id
  if (!headSha) return

  // Collect unique changed files across all commits with their status
  const fileMap = new Map<string, ChangedFile>()

  for (const commit of commits) {
    for (const path of commit.added ?? []) {
      fileMap.set(path, { path, status: "added" })
    }
    for (const path of commit.modified ?? []) {
      fileMap.set(path, { path, status: "modified" })
    }
    for (const path of commit.removed ?? []) {
      fileMap.set(path, { path, status: "removed" })
    }
  }

  await step.run("fire-embedding-update", async () => {
    const { inngest: client } = await import("@/inngest/client")
    await client.send({
      name: "github/repo.files-changed",
      data: {
        project_id: project.id,
        repo_full_name: repository.full_name,
        installation_id: project.github_installation_id,
        head_sha: headSha,
        changed_files: Array.from(fileMap.values()),
      },
    })
  })
}
