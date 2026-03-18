import type { PushCommit } from "@/lib/github/webhook";
import type { BrandExample } from "@/lib/db/types";

export type CommitWithContext = PushCommit & {
  diffText?: string;
};

type BrandExamplesByPlatform = {
  linkedin: string[];
  twitter: string[];
  changelog: string[];
};

function groupExamplesByPlatform(examples: BrandExample[]): BrandExamplesByPlatform {
  return examples.reduce<BrandExamplesByPlatform>(
    (acc, ex) => {
      acc[ex.platform].push(ex.content);
      return acc;
    },
    { linkedin: [], twitter: [], changelog: [] }
  );
}

function buildFewShotBlock(label: string, examples: string[]): string {
  if (examples.length === 0) return "";
  const formatted = examples.map((e, i) => `Example ${i + 1}:\n${e}`).join("\n\n");
  return `\n\nBRAND VOICE EXAMPLES FOR ${label.toUpperCase()} (match this person's style, tone, and formatting):\n${formatted}`;
}

function formatCommitForPrompt(c: CommitWithContext): string {
  const header = `Commit ${c.id.slice(0, 7)}: ${c.message}`;
  const fileLists: string[] = [];
  if (c.added?.length) fileLists.push(`Added: ${c.added.join(", ")}`);
  if (c.modified?.length) fileLists.push(`Modified: ${c.modified.join(", ")}`);
  if (c.removed?.length) fileLists.push(`Removed: ${c.removed.join(", ")}`);
  const fileInfo = fileLists.length ? `\nFiles: ${fileLists.join(" | ")}` : "";
  const diff = c.diffText ? `\nDiff:\n${c.diffText}` : "";
  return `${header}${fileInfo}${diff}`;
}

export function buildSignificancePrompt(commits: CommitWithContext[]): string {
  const commitBlocks = commits.map((c) => formatCommitForPrompt(c)).join("\n\n---\n\n");

  return `You are a technical product analyst. Look at these Git commits (messages, changed files, and code diffs) and determine if they contain user-facing value.

COMMITS:
${commitBlocks}

Consider "significant" as: new features, major bug fixes, notable improvements, or breaking changes that affect users. Use the diff to see what actually changed—don't rely only on the commit message.
Consider "NOT significant" as: typo fixes, refactors, dependency updates, config changes, .gitignore updates, code style fixes, or internal-only changes.

Answer with exactly one word: YES or NO`;
}

export function buildGenerationPrompt(
  commits: PushCommit[],
  brandVoice: string = "Professional",
  brandExamples: BrandExample[] = []
): string {
  const commitList = commits
    .map((c) => `- ${c.message}`)
    .join("\n");

  const examples = groupExamplesByPlatform(brandExamples);
  const linkedinExamples = buildFewShotBlock("linkedin", examples.linkedin);
  const twitterExamples = buildFewShotBlock("twitter/x", examples.twitter);
  const changelogExamples = buildFewShotBlock("changelog", examples.changelog);

  const hasExamples = brandExamples.length > 0;
  const voiceInstruction = hasExamples
    ? "The user has provided example posts below — match their writing style, tone, vocabulary, and formatting exactly."
    : `Write in a "${brandVoice}" voice.`;

  return `You are a product marketing writer. Based on these technical commits, create marketing content.
${voiceInstruction}

COMMITS:
${commitList}${linkedinExamples}${twitterExamples}${changelogExamples}

Generate a JSON object with exactly these three keys (no extra keys):
- "changelog": A bullet-point changelog (3-5 bullets) focused on user benefits. Each bullet starts with "- ".
- "linkedin": A LinkedIn post (2-4 short paragraphs) in "Build in Public" style. Hook-heavy, authentic founder voice.
- "twitter": A Twitter/X thread (2-4 tweets, each under 280 chars). Concise and engaging. Format as array of strings.

Return ONLY valid JSON, no markdown or extra text.`;
}
