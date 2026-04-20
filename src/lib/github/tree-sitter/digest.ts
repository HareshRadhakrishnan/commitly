import path from "path"
import type { Node } from "web-tree-sitter"
import { parseHunkRanges } from "@/lib/github/chunker"
import { grammarForPath, parseSource } from "./parser"

type SymbolInfo = {
  kind: string   // function | class | interface | type | enum | const
  name: string
  startLine: number  // 1-based
  endLine: number    // 1-based
}

// Only these direct-child types are inspected for named symbol extraction.
const DECLARATION_TYPES = new Set([
  "function_declaration",
  "class_declaration",
  "abstract_class_declaration",
  "interface_declaration",
  "type_alias_declaration",
  "enum_declaration",
  "lexical_declaration",
  "export_statement",
])

function extractSymbol(node: Node): SymbolInfo | null {
  const startLine = node.startPosition.row + 1  // 1-based
  const endLine   = node.endPosition.row   + 1  // 1-based

  switch (node.type) {
    case "function_declaration": {
      const name = node.childForFieldName("name")?.text
      return name ? { kind: "function", name, startLine, endLine } : null
    }
    case "class_declaration":
    case "abstract_class_declaration": {
      const name = node.childForFieldName("name")?.text
      return name ? { kind: "class", name, startLine, endLine } : null
    }
    case "interface_declaration": {
      const name = node.childForFieldName("name")?.text
      return name ? { kind: "interface", name, startLine, endLine } : null
    }
    case "type_alias_declaration": {
      const name = node.childForFieldName("name")?.text
      return name ? { kind: "type", name, startLine, endLine } : null
    }
    case "enum_declaration": {
      const name = node.childForFieldName("name")?.text
      return name ? { kind: "enum", name, startLine, endLine } : null
    }
    case "lexical_declaration": {
      // e.g. const handleClick = () => { ... }
      const declarator = node.namedChildren.find((c) => c?.type === "variable_declarator")
      const name = declarator?.childForFieldName("name")?.text
      const valueType = declarator?.childForFieldName("value")?.type ?? ""
      if (!name) return null
      const isFn = valueType === "arrow_function" || valueType === "function_expression"
      return { kind: isFn ? "function" : "const", name, startLine, endLine }
    }
    case "export_statement": {
      const decl = node.childForFieldName("declaration")
      return decl ? extractSymbol(decl) : null
    }
    default:
      return null
  }
}

function overlaps(
  symbolStart: number,
  symbolEnd: number,
  hunks: { start: number; end: number }[],
): boolean {
  return hunks.some((h) => symbolStart <= h.end && symbolEnd >= h.start)
}

/**
 * Builds a compact structural change digest for a single file by:
 *   1. Parsing the file with Tree-sitter to get top-level symbol positions
 *   2. Intersecting those positions with the diff hunk ranges
 *   3. Returning a human-readable bullet list of changed symbols
 *
 * Example output:
 *   auth.ts:
 *     ~ `handleSignIn` [function]
 *     ~ `AuthService` [class]
 *
 * Returns null if the file extension is unsupported, parsing fails, or
 * no named symbols overlap with the diff hunks.
 */
export async function buildFileDigest(
  filePath: string,
  fileContent: string,
  diffText: string,
  opts: { maxSymbols?: number } = {},
): Promise<string | null> {
  const grammar = grammarForPath(filePath)
  if (!grammar) return null

  const hunks = parseHunkRanges(diffText)
  if (hunks.length === 0) return null

  const tree = await parseSource(fileContent, grammar)
  if (!tree) return null

  const maxSymbols = opts.maxSymbols ?? 6
  const matched: SymbolInfo[] = []

  for (const child of tree.rootNode.namedChildren) {
    if (!child || !DECLARATION_TYPES.has(child.type)) continue
    const info = extractSymbol(child)
    if (!info) continue
    if (overlaps(info.startLine, info.endLine, hunks)) {
      matched.push(info)
      if (matched.length >= maxSymbols) break
    }
  }

  tree.delete()

  if (matched.length === 0) return null

  const fileName = path.basename(filePath)
  const bullets = matched.map((s) => `  ~ \`${s.name}\` [${s.kind}]`).join("\n")
  return `${fileName}:\n${bullets}`
}

/**
 * Builds a per-commit structural digest by processing up to `maxFiles`
 * changed files. Each file contributes one block to the final string.
 *
 * Returns undefined when no supported files have parseable symbol changes.
 */
export async function buildCommitDigest(
  files: { filename: string; patch: string | null; content: string | null }[],
  opts: { maxFiles?: number; maxSymbolsPerFile?: number } = {},
): Promise<string | undefined> {
  const maxFiles = opts.maxFiles ?? 4
  const maxSymbols = opts.maxSymbolsPerFile ?? 6

  const blocks: string[] = []

  for (const file of files.slice(0, maxFiles)) {
    if (!file.content || !file.patch) continue
    const block = await buildFileDigest(file.filename, file.content, file.patch, { maxSymbols })
    if (block) blocks.push(block)
  }

  return blocks.length > 0 ? blocks.join("\n\n") : undefined
}
