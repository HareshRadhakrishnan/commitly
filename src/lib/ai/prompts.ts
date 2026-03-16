import type { PushCommit } from "@/lib/github/webhook";

export function buildSignificancePrompt(commits: PushCommit[]): string {
  const commitList = commits
    .map((c) => `- ${c.message} (${c.id.slice(0, 7)})`)
    .join("\n");

  return `You are a technical product analyst. Look at these Git commits and determine if they contain user-facing value.

COMMITS:
${commitList}

Consider "significant" as: new features, major bug fixes, notable improvements, or breaking changes that affect users.
Consider "NOT significant" as: typo fixes, refactors, dependency updates, config changes, .gitignore updates, code style fixes, or internal-only changes.

Answer with exactly one word: YES or NO`;
}

export function buildGenerationPrompt(
  commits: PushCommit[],
  brandVoice: string = "Professional"
): string {
  const commitList = commits
    .map((c) => `- ${c.message}`)
    .join("\n");

  return `You are a product marketing writer. Based on these technical commits, create marketing content in a "${brandVoice}" voice.

COMMITS:
${commitList}

Generate a JSON object with exactly these three keys (no extra keys):
- "changelog": A bullet-point changelog (3-5 bullets) focused on user benefits. Each bullet starts with "- ".
- "linkedin": A LinkedIn post (2-4 short paragraphs) in "Build in Public" style. Hook-heavy, authentic founder voice.
- "twitter": A Twitter/X thread (2-4 tweets, each under 280 chars). Concise and engaging. Format as array of strings.

Return ONLY valid JSON, no markdown or extra text.`;
}
