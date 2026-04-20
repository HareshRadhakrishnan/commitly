import { createHash } from "crypto"
import type { FileChunk } from "@/lib/github/chunker"
import { grammarForPath, parseSource } from "./parser"

const MAX_CHUNK_CHARS = 2000
const CHUNK_OVERLAP_CHARS = 100

// Node types that represent top-level declarations and warrant their own chunk.
// These must be direct children of the root `program` node.
const DECLARATION_TYPES = new Set([
  "function_declaration",
  "class_declaration",
  "abstract_class_declaration",
  "interface_declaration",
  "type_alias_declaration",
  "enum_declaration",
  "lexical_declaration",  // const/let/var — may contain arrow functions
  "export_statement",     // export default / named export wrapping any of the above
])

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex")
}

type RawUnit = {
  startLine: number  // 1-based
  endLine: number    // 1-based
  content: string
}

/**
 * Expands a RawUnit into one or more FileChunks.
 * Units that exceed MAX_CHUNK_CHARS are split by character count with a small
 * overlap to avoid losing context at split boundaries.
 */
function unitToChunks(unit: RawUnit, chunkIndexRef: { n: number }): FileChunk[] {
  const content = unit.content.trim()
  if (!content) return []

  if (content.length <= MAX_CHUNK_CHARS) {
    return [{
      content,
      contentSha: sha256(content),
      startLine: unit.startLine,
      endLine: unit.endLine,
      chunkIndex: chunkIndexRef.n++,
    }]
  }

  // Split oversized unit with overlap
  const results: FileChunk[] = []
  let charOffset = 0
  let lineOffset = unit.startLine

  while (charOffset < content.length) {
    const slice = content.slice(charOffset, charOffset + MAX_CHUNK_CHARS).trim()
    if (slice) {
      const sliceLineCount = slice.split("\n").length
      results.push({
        content: slice,
        contentSha: sha256(slice),
        startLine: lineOffset,
        endLine: Math.min(lineOffset + sliceLineCount - 1, unit.endLine),
        chunkIndex: chunkIndexRef.n++,
      })
      lineOffset = Math.min(lineOffset + sliceLineCount - 1, unit.endLine)
    }
    charOffset += MAX_CHUNK_CHARS - CHUNK_OVERLAP_CHARS
    if (charOffset >= content.length) break
  }

  return results
}

/**
 * Splits a file into function/class-level chunks using Tree-sitter CST parsing
 * for TypeScript, TSX, and JavaScript files.
 *
 * Returns null if the file extension is unsupported or parsing fails, so the
 * caller can fall back to the regex-based chunker.
 *
 * The returned FileChunk[] shape is identical to the regex chunker's output,
 * making this a drop-in replacement for the RAG indexing pipeline.
 */
export async function chunkFileWithCST(
  content: string,
  filePath: string,
): Promise<FileChunk[] | null> {
  const grammar = grammarForPath(filePath)
  if (!grammar) return null

  const tree = await parseSource(content, grammar)
  if (!tree) return null

  const lines = content.split("\n")
  const declarationUnits: RawUnit[] = []
  let preambleEndRow = -1  // 0-indexed row of last non-declaration child

  for (const child of tree.rootNode.namedChildren) {
    if (!child) continue  // namedChildren may contain nulls in some tree-sitter versions
    const startRow = child.startPosition.row  // 0-indexed
    const endRow   = child.endPosition.row    // 0-indexed

    if (DECLARATION_TYPES.has(child.type)) {
      declarationUnits.push({
        startLine: startRow + 1,
        endLine:   endRow   + 1,
        content:   lines.slice(startRow, endRow + 1).join("\n"),
      })
    } else {
      preambleEndRow = Math.max(preambleEndRow, endRow)
    }
  }

  tree.delete()

  const units: RawUnit[] = []

  // Preamble: imports, module-level comments, etc. before the first declaration
  const firstDeclStart = declarationUnits[0]?.startLine ?? lines.length + 1
  if (firstDeclStart > 1) {
    const preambleContent = lines.slice(0, firstDeclStart - 1).join("\n").trim()
    if (preambleContent) {
      units.push({ startLine: 1, endLine: firstDeclStart - 1, content: preambleContent })
    }
  }

  units.push(...declarationUnits)

  if (units.length === 0) return null

  const chunkIndexRef = { n: 0 }
  return units.flatMap((u) => unitToChunks(u, chunkIndexRef))
}
