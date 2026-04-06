import { createHash } from "crypto"

export type FileChunk = {
  content: string
  contentSha: string
  startLine: number  // 1-based, inclusive
  endLine: number    // 1-based, inclusive
  chunkIndex: number
}

const MAX_CHUNK_CHARS = 2000
const CHUNK_OVERLAP_CHARS = 100

/**
 * Top-level boundary patterns for common languages.
 * A line matching one of these at column 0 starts a new logical chunk.
 */
const BOUNDARY_PATTERNS = [
  /^export\s+(default\s+)?(async\s+)?function\s/,
  /^export\s+(default\s+)?class\s/,
  /^export\s+(const|let|var)\s+\w+\s*[:=]/,
  /^export\s+(type|interface|enum)\s/,
  /^export\s+default\s/,
  /^(async\s+)?function\s+\w+/,
  /^class\s+\w+/,
  /^const\s+\w+\s*=\s*(async\s+)?\(/,
  /^const\s+\w+\s*=\s*(async\s+)?function/,
  /^def\s+\w+/,        // Python
  /^class\s+\w+.*:/,   // Python
  /^func\s+/,          // Go
  /^fn\s+/,            // Rust
  /^pub\s+(fn|struct|enum|trait)\s/,  // Rust public items
  /^##\s/,             // Markdown h2 (section boundary)
  /^#\s/,              // Markdown h1
]

function isBoundary(line: string): boolean {
  return BOUNDARY_PATTERNS.some((p) => p.test(line))
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex")
}

/**
 * Splits a file's text content into function/class-level chunks.
 * Boundary detection uses heuristic regex patterns that cover TS/JS/Python/Go/Rust/Markdown.
 *
 * If a single logical unit exceeds MAX_CHUNK_CHARS, it is further split by character count
 * with a small overlap to avoid losing context at split points.
 *
 * Returns chunks with 1-based line numbers for use in line-range overlap queries.
 */
export function chunkFile(content: string, filePath: string): FileChunk[] {
  const lines = content.split("\n")
  const chunks: FileChunk[] = []
  let chunkIndex = 0

  // Group lines into logical units at boundary points
  const units: { startLine: number; lines: string[] }[] = []
  let currentUnit: { startLine: number; lines: string[] } | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNo = i + 1  // 1-based

    if (isBoundary(line) || currentUnit === null) {
      if (currentUnit !== null && currentUnit.lines.length > 0) {
        units.push(currentUnit)
      }
      currentUnit = { startLine: lineNo, lines: [line] }
    } else {
      currentUnit.lines.push(line)
    }
  }

  if (currentUnit && currentUnit.lines.length > 0) {
    units.push(currentUnit)
  }

  // Markdown and files with no boundaries produce a single unit — split by chars
  for (const unit of units) {
    const unitContent = unit.lines.join("\n")
    const unitEndLine = unit.startLine + unit.lines.length - 1

    if (unitContent.length <= MAX_CHUNK_CHARS) {
      const trimmed = unitContent.trim()
      if (!trimmed) continue
      chunks.push({
        content: trimmed,
        contentSha: sha256(trimmed),
        startLine: unit.startLine,
        endLine: unitEndLine,
        chunkIndex: chunkIndex++,
      })
      continue
    }

    // Unit is too large: split by character count with overlap
    let charOffset = 0
    let lineOffset = unit.startLine

    while (charOffset < unitContent.length) {
      const slice = unitContent.slice(charOffset, charOffset + MAX_CHUNK_CHARS)
      const trimmed = slice.trim()
      if (trimmed) {
        const sliceLines = slice.split("\n").length
        chunks.push({
          content: trimmed,
          contentSha: sha256(trimmed),
          startLine: lineOffset,
          endLine: Math.min(lineOffset + sliceLines - 1, unitEndLine),
          chunkIndex: chunkIndex++,
        })
        lineOffset = Math.max(lineOffset, lineOffset + sliceLines - 1)
      }
      charOffset += MAX_CHUNK_CHARS - CHUNK_OVERLAP_CHARS
      if (charOffset >= unitContent.length) break
    }
  }

  // Fallback: if nothing was chunked (e.g. empty file), skip
  if (chunks.length === 0) return []

  // For .md files or configs with no function boundaries, the whole file may land in
  // one giant unit. Already handled above by the char-split loop.
  void filePath  // used by callers for context; not needed inside this function

  return chunks
}

/**
 * Parses the `@@ -old,count +new,count @@` hunk headers from a unified diff string.
 * Returns the changed line ranges in the NEW file (+ side).
 */
export function parseHunkRanges(diffText: string): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = []
  const hunkHeader = /^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,(\d+))?\s+@@/gm
  let match: RegExpExecArray | null

  while ((match = hunkHeader.exec(diffText)) !== null) {
    const start = parseInt(match[1], 10)
    const count = match[2] !== undefined ? parseInt(match[2], 10) : 1
    const end = start + Math.max(count - 1, 0)
    ranges.push({ start, end })
  }

  return ranges
}
