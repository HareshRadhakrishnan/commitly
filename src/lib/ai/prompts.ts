import type { PushCommit } from "@/lib/github/webhook"
import type { BrandExample } from "@/lib/db/types"
import type { ImportGraph } from "@/lib/github/tree-sitter/graph"
import { formatCodeGraph } from "@/lib/github/tree-sitter/graph"

// Per-file context cap for the explanation prompt — keeps each file's contribution
// well within the budget of a single gpt-4o-mini call even for multi-file commits.
const MAX_CONTEXT_CHARS_PER_FILE = 600

export type CommitWithContext = PushCommit & {
  diffText?: string
  retrievedContext?: { filePath: string; content: string }[]  // chunks from vector store / fallback
  explanation?: string    // plain-English explanation from explain-commits step
  structuralDigest?: string  // CST-derived symbol-level change summary (Tree-sitter)
  /** All changed files surviving the denylist filter, in diff-fetch order. Set in fetch-diffs. */
  changedFileDetails?: { filename: string; status: string; additions: number; deletions: number }[]
  /** File paths classified as "core" by the LLM. Set in classify-files. Used to reorder retrieve-context. */
  coreFileNames?: string[]
}

type BrandExamplesByPlatform = {
  linkedin: string[]
  twitter: string[]
  changelog: string[]
}

function groupExamplesByPlatform(examples: BrandExample[]): BrandExamplesByPlatform {
  return examples.reduce<BrandExamplesByPlatform>(
    (acc, ex) => {
      acc[ex.platform].push(ex.content)
      return acc
    },
    { linkedin: [], twitter: [], changelog: [] }
  )
}

function buildFewShotBlock(label: string, examples: string[]): string {
  if (examples.length === 0) return ""
  const formatted = examples.map((e, i) => `Example ${i + 1}:\n${e}`).join("\n\n")
  return `\n\nBRAND VOICE EXAMPLES FOR ${label.toUpperCase()} (match this person's style, tone, and formatting):\n${formatted}`
}

/**
 * Formats a commit for the significance check prompt.
 *
 * Token-cost strategy: prefer the structural digest (compact symbol list) over
 * the raw diff. Include a short diff excerpt only when no digest is available,
 * capped to 300 chars to keep the significance prompt small.
 */
function formatCommitForSignificance(c: CommitWithContext): string {
  const header = `Commit ${c.id.slice(0, 7)}: ${c.message}`
  const fileLists: string[] = []
  if (c.added?.length)    fileLists.push(`Added: ${c.added.join(", ")}`)
  if (c.modified?.length) fileLists.push(`Modified: ${c.modified.join(", ")}`)
  if (c.removed?.length)  fileLists.push(`Removed: ${c.removed.join(", ")}`)
  const fileInfo = fileLists.length ? `\nFiles: ${fileLists.join(" | ")}` : ""

  // Prefer structural digest — it names the exact symbols that changed, not raw patch noise
  const context = c.structuralDigest
    ? `\nChanged symbols:\n${c.structuralDigest}`
    : c.diffText
      ? `\nDiff:\n${c.diffText.slice(0, 300)}`
      : ""

  return `${header}${fileInfo}${context}`
}

/**
 * Formats a commit for the explanation prompt.
 *
 * Token-cost strategy:
 *   - Structural digest is shown first (precise, cheap)
 *   - RAG context is capped per file (MAX_CONTEXT_CHARS_PER_FILE)
 *   - Raw diffText is omitted when either digest or RAG context is present
 */
function formatCommitForExplanation(c: CommitWithContext): string {
  const header = `### Commit ${c.id.slice(0, 7)}\nMessage: ${c.message}`

  const digestBlock = c.structuralDigest
    ? `Changed symbols:\n${c.structuralDigest}\n\n`
    : ""

  let codeContext: string
  if (c.retrievedContext && c.retrievedContext.length > 0) {
    codeContext = c.retrievedContext
      .map((ctx) => `// ${ctx.filePath}\n${ctx.content.slice(0, MAX_CONTEXT_CHARS_PER_FILE)}`)
      .join("\n\n")
  } else if (!c.structuralDigest && c.diffText) {
    // Only fall back to raw diff when we have nothing better
    codeContext = c.diffText
  } else {
    codeContext = ""
  }

  const contextBlock = codeContext ? `Context:\n${codeContext}` : ""

  return `${header}\n\n${digestBlock}${contextBlock}`.trimEnd()
}

/**
 * Formats a commit for the generation (marketing content) prompt.
 *
 * Token-cost strategy: once we have an explanation, raw diff is irrelevant.
 * Only include a short diff excerpt when we have no explanation AND no digest.
 */
function formatCommitForGeneration(c: CommitWithContext): string {
  const header = `- ${c.message}`
  const explanation = c.explanation ? `\n  Engineering context: ${c.explanation}` : ""
  const hasRichContext = Boolean(c.explanation || c.structuralDigest)
  const diff = !hasRichContext && c.diffText
    ? `\n  Diff summary:\n${c.diffText.slice(0, 300)}`
    : ""
  return `${header}${explanation}${diff}`
}

/**
 * Builds the prompt for the file classification step.
 *
 * The LLM receives the repo purpose and the list of changed files (paths +
 * change counts only — no patch content) and classifies each as:
 *   "core"    — product/feature logic that users interact with
 *   "support" — tests, scripts, build tooling
 *   "infra"   — config, CI, docs, environment
 *
 * Only "core" files drive context retrieval and changelog generation.
 * Input is intentionally tiny (~150 tokens) so this runs cheaply on every push.
 */
export function buildClassificationPrompt(
  commits: CommitWithContext[],
  repoSummary: string | null,
  codeGraph: ImportGraph | null = null,
): string {
  const repoContext = repoSummary
    ? `Repo purpose: ${repoSummary}\n\n`
    : ""

  // Inject the code graph so the classifier knows which files are structural
  // entry points or core modules — independent of file naming conventions.
  const graphContext = codeGraph
    ? `Code structure:\n${formatCodeGraph(codeGraph)}\n\n`
    : ""

  // Deduplicate file paths across all commits (a file may appear in multiple commits)
  const seen = new Set<string>()
  const fileLines: string[] = []

  for (const commit of commits) {
    for (const f of commit.changedFileDetails ?? []) {
      if (seen.has(f.filename)) continue
      seen.add(f.filename)
      fileLines.push(`- ${f.filename} (+${f.additions}/-${f.deletions}) [${f.status}]`)
    }
  }

  if (fileLines.length === 0) return ""

  return `${repoContext}${graphContext}Classify each changed file based on the repo purpose and code structure above.

Changed files:
${fileLines.join("\n")}

Categories:
- "core": product or feature logic that end users interact with (source code, UI, API handlers, business logic)
- "support": tests, scripts, build tooling, CI pipelines
- "infra": config files, environment files, docs, lock files, CI YAMLs

Use the "Code structure" section above to help — entry points and highly-imported modules are always "core".

Return ONLY a valid JSON array, no markdown or extra text:
[{ "filename": "path/to/file.ts", "category": "core" | "support" | "infra" }]`
}

export function buildSignificancePrompt(
  commits: CommitWithContext[],
  repoSummary: string | null = null
): string {
  const commitBlocks = commits.map((c) => formatCommitForSignificance(c)).join("\n\n---\n\n")

  const repoContext = repoSummary
    ? `Repo purpose: ${repoSummary}\n\n`
    : ""

  return `You are a technical product analyst. Look at these Git commits (messages, changed files, and code changes) and determine if they contain user-facing value.

${repoContext}COMMITS:
${commitBlocks}

Consider "significant" as: new features, major bug fixes, notable improvements, or breaking changes that affect users. Use the changed symbols or diff to see what actually changed—don't rely only on the commit message.
Consider "NOT significant" as: typo fixes, refactors, dependency updates, config changes, .gitignore updates, code style fixes, or internal-only changes.

Answer with exactly one word: YES or NO`
}

export function buildExplanationPrompt(
  commits: CommitWithContext[],
  repoSummary: string | null,
  codeGraph: ImportGraph | null = null,
): string {
  const repoContext = repoSummary
    ? `Repo context: ${repoSummary}\n\n`
    : ""

  // Include the code graph so the explainer understands each changed file's
  // structural role: whether it's an entry point, a highly-shared utility, etc.
  const graphContext = codeGraph
    ? `Code structure:\n${formatCodeGraph(codeGraph)}\n\n`
    : ""

  const commitBlocks = commits
    .map((c) => formatCommitForExplanation(c))
    .join("\n\n---\n\n")

  return `You are a senior engineer reviewing a code change.

${repoContext}${graphContext}For each commit below, explain:
1. What changed (be specific about the code, not just the commit message)
2. Why it matters (impact on the system or users) — use the code structure above to assess blast radius
3. Any risks or improvements to be aware of

${commitBlocks}

Return ONLY a valid JSON array with no extra text or markdown:
[{ "sha": "<first 7 chars>", "explanation": "<plain English explanation>" }]`
}

export function buildGenerationPrompt(
  commits: CommitWithContext[],
  brandVoice: string = "Professional",
  brandExamples: BrandExample[] = []
): string {
  const commitList = commits.map((c) => formatCommitForGeneration(c)).join("\n")

  const examples = groupExamplesByPlatform(brandExamples)
  const linkedinExamples = buildFewShotBlock("linkedin", examples.linkedin)
  const twitterExamples = buildFewShotBlock("twitter/x", examples.twitter)
  const changelogExamples = buildFewShotBlock("changelog", examples.changelog)

  const hasExamples = brandExamples.length > 0
  const voiceInstruction = hasExamples
    ? "The user has provided example posts below — match their writing style, tone, vocabulary, and formatting exactly."
    : `Write in a "${brandVoice}" voice.`

  return `You are a product marketing writer. Based on these technical commits, create marketing content.
${voiceInstruction}

COMMITS:
${commitList}${linkedinExamples}${twitterExamples}${changelogExamples}

Generate a JSON object with exactly these three keys (no extra keys):
- "changelog": A bullet-point changelog (3-5 bullets) focused on user benefits. Each bullet starts with "- ".
- "linkedin": A LinkedIn post (2-4 short paragraphs) in "Build in Public" style. Hook-heavy, authentic founder voice.
- "twitter": A Twitter/X thread (2-4 tweets, each under 280 chars). Concise and engaging. Format as array of strings.

Return ONLY valid JSON, no markdown or extra text.`
}
