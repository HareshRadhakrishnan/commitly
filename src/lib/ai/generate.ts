import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { CommitWithContext } from "./prompts"
import {
  buildSignificancePrompt,
  buildGenerationPrompt,
  buildExplanationPrompt,
  buildClassificationPrompt,
} from "./prompts"
import type { BrandExample } from "@/lib/db/types"
import type { ImportGraph } from "@/lib/github/tree-sitter/graph"

export async function checkSignificance(
  commits: CommitWithContext[],
  repoSummary: string | null = null
): Promise<boolean> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: buildSignificancePrompt(commits, repoSummary),
    maxOutputTokens: 16,
  })

  const answer = text.trim().toUpperCase()
  return answer === "YES" || answer.startsWith("YES")
}

export async function explainCommits(
  commits: CommitWithContext[],
  repoSummary: string | null,
  codeGraph: ImportGraph | null = null,
): Promise<{ sha: string; explanation: string }[]> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: buildExplanationPrompt(commits, repoSummary, codeGraph),
    maxOutputTokens: 1200,
  })

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
    const parsed = JSON.parse(cleaned) as unknown

    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (item): item is { sha: string; explanation: string } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).sha === "string" &&
          typeof (item as Record<string, unknown>).explanation === "string"
      )
      .map((item) => ({ sha: item.sha, explanation: item.explanation }))
  } catch {
    return []
  }
}

/**
 * Classifies each changed file as "core", "support", or "infra" using the
 * repo summary for context. Returns a map of filename → category.
 *
 * Used in the classify-files step to decide which files get context retrieval
 * and drive changelog generation. Non-fatal: caller falls back to all files.
 */
export async function classifyFiles(
  commits: CommitWithContext[],
  repoSummary: string | null,
  codeGraph: ImportGraph | null = null,
): Promise<Map<string, "core" | "support" | "infra">> {
  const prompt = buildClassificationPrompt(commits, repoSummary, codeGraph)
  if (!prompt) return new Map()

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
    maxOutputTokens: 512,
  })

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
    const parsed = JSON.parse(cleaned) as unknown

    if (!Array.isArray(parsed)) return new Map()

    const result = new Map<string, "core" | "support" | "infra">()
    for (const item of parsed) {
      if (
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).filename === "string" &&
        ["core", "support", "infra"].includes((item as Record<string, unknown>).category as string)
      ) {
        result.set(
          (item as Record<string, unknown>).filename as string,
          (item as Record<string, unknown>).category as "core" | "support" | "infra"
        )
      }
    }
    return result
  } catch {
    return new Map()
  }
}

export async function generateContent(
  commits: CommitWithContext[],
  brandVoice?: string,
  brandExamples?: BrandExample[]
): Promise<{ changelog: string; linkedin: string; twitter: string[] }> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: buildGenerationPrompt(commits, brandVoice, brandExamples),
    maxOutputTokens: 1500,
  })

  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
  const parsed = JSON.parse(cleaned) as {
    changelog?: string
    linkedin?: string
    twitter?: string[] | string
  }

  const twitter = Array.isArray(parsed.twitter)
    ? parsed.twitter
    : typeof parsed.twitter === "string"
      ? [parsed.twitter]
      : []

  return {
    changelog: parsed.changelog ?? "",
    linkedin: parsed.linkedin ?? "",
    twitter,
  }
}
