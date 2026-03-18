import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { CommitWithContext } from "./prompts";
import { buildSignificancePrompt, buildGenerationPrompt } from "./prompts";
import type { PushCommit } from "@/lib/github/webhook";

export async function checkSignificance(commits: CommitWithContext[]): Promise<boolean> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: buildSignificancePrompt(commits),
    maxOutputTokens: 16,
  });

  const answer = text.trim().toUpperCase();
  return answer === "YES" || answer.startsWith("YES");
}

export async function generateContent(
  commits: PushCommit[],
  brandVoice?: string
): Promise<{ changelog: string; linkedin: string; twitter: string[] }> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: buildGenerationPrompt(commits, brandVoice),
    maxOutputTokens: 1500,
  });

  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as {
    changelog?: string;
    linkedin?: string;
    twitter?: string[] | string;
  };

  const twitter = Array.isArray(parsed.twitter)
    ? parsed.twitter
    : typeof parsed.twitter === "string"
      ? [parsed.twitter]
      : [];

  return {
    changelog: parsed.changelog ?? "",
    linkedin: parsed.linkedin ?? "",
    twitter,
  };
}
