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
import { checkSignificance, explainCommits, generateContent } from "@/lib/ai/generate"
import { sendDraftNotificationEmail } from "@/lib/email/resend"
import { fetchCommitDiff } from "@/lib/github/app"
import { getBrandExamplesForUser } from "@/lib/db/brand-examples"
import { getFileContext, handleDeletedFile } from "@/lib/github/context"
import { fetchFileContent } from "@/lib/github/app"
import { buildCommitDigest } from "@/lib/github/tree-sitter/digest"
import { embedMany } from "ai"
import { openai } from "@ai-sdk/openai"
import { queryRelatedChunks } from "@/lib/db/repo-chunks"
import type { ChangedFile } from "./update-embeddings"

type PushEventData = {
  repository: {
    id: number
    full_name: string
    name: string
  }
  commits: PushCommit[]
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

            const parts = detail.files
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
      return checkSignificance(commitsWithContext)
    })

    if (!isSignificant) {
      // Fire embedding update as a side-effect even for insignificant pushes
      // so the index stays fresh for future significant ones.
      await fireEmbeddingUpdate(step, project, repository, commits, commitsWithContext)
      return { skipped: true, reason: "commits not significant" }
    }

    // ── Step 3: fire embedding update (non-blocking, runs in parallel) ───────
    await fireEmbeddingUpdate(step, project, repository, commits, commitsWithContext)

    // ── Step 4: retrieve context for each commit using tiered fallback ────────
    const commitsWithRetrievedContext = await step.run(
      "retrieve-context",
      async (): Promise<CommitWithContext[]> => {
        const installationId = project.github_installation_id
        const hasInstallation = typeof installationId === "number"

        return Promise.all(
          commitsWithContext.map(async (commit) => {
            const detail = await fetchCommitDiff(
              repository.full_name,
              hasInstallation ? installationId! : 0,
              commit.id
            ).catch(() => null)

            if (!detail?.files?.length) return commit

            const contextFiles = detail.files
              .slice(0, MAX_CONTEXT_FILES_PER_COMMIT)

            // Handle deletions first
            if (hasInstallation) {
              await Promise.all(
                detail.files
                  .filter((f) => f.status === "removed")
                  .map((f) => handleDeletedFile(project.id, f.filename))
              )
            }

            // Get context for each non-deleted file using tiered fallback
            const retrievedContext: { filePath: string; content: string }[] = []

            for (const file of contextFiles.filter((f) => f.status !== "removed")) {
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
                      patch: f.patch,
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
          project.repo_summary ?? null
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
