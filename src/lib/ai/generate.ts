import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { CommitWithContext } from "./prompts"
import {
  buildSignificancePrompt,
  buildGenerationPrompt,
  buildExplanationPrompt,
} from "./prompts"
import type { BrandExample } from "@/lib/db/types"

export async function checkSignificance(commits: CommitWithContext[]): Promise<boolean> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: buildSignificancePrompt(commits),
    maxOutputTokens: 16,
  })

  const answer = text.trim().toUpperCase()
  return answer === "YES" || answer.startsWith("YES")
}

export async function explainCommits(
  commits: CommitWithContext[],
  repoSummary: string | null
): Promise<{ sha: string; explanation: string }[]> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: buildExplanationPrompt(commits, repoSummary),
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
