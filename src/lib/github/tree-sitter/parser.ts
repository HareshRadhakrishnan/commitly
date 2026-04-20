import path from "path"
import fs from "fs/promises"
import { Parser, Language } from "web-tree-sitter"
import type { Tree } from "web-tree-sitter"

export type SupportedGrammar = "javascript" | "typescript" | "tsx"

const GRAMMAR_FILES: Record<SupportedGrammar, string> = {
  javascript: "tree-sitter-javascript.wasm",
  typescript: "tree-sitter-typescript.wasm",
  tsx:        "tree-sitter-tsx.wasm",
}

// WASM binaries are copied to public/wasm/ by the postinstall script.
// process.cwd() resolves correctly both locally and on Vercel.
const wasmDir = () => path.join(process.cwd(), "public", "wasm")

let initPromise: Promise<void> | null = null
const languageCache = new Map<SupportedGrammar, Language>()

async function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = Parser.init({
      locateFile: (name: string) => path.join(wasmDir(), name),
    })
  }
  await initPromise
}

async function loadLanguage(grammar: SupportedGrammar): Promise<Language> {
  await ensureInit()

  const cached = languageCache.get(grammar)
  if (cached) return cached

  const wasmBytes = await fs.readFile(path.join(wasmDir(), GRAMMAR_FILES[grammar]))
  const language = await Language.load(wasmBytes)
  languageCache.set(grammar, language)
  return language
}

/**
 * Returns the Tree-sitter grammar name for a file path, or null if not supported.
 * Markdown is intentionally excluded — the regex chunker handles it fine.
 */
export function grammarForPath(filePath: string): SupportedGrammar | null {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".tsx") return "tsx"
  if (ext === ".ts" || ext === ".mts" || ext === ".cts") return "typescript"
  if (ext === ".js" || ext === ".mjs" || ext === ".cjs" || ext === ".jsx") return "javascript"
  return null
}

/**
 * Parses source code with Tree-sitter. Returns the syntax Tree, or null on
 * failure. The caller is responsible for calling tree.delete() when done.
 * Creates a short-lived Parser instance (avoids shared mutable state across
 * concurrent Inngest function calls).
 */
export async function parseSource(source: string, grammar: SupportedGrammar): Promise<Tree | null> {
  try {
    const language = await loadLanguage(grammar)
    const parser = new Parser()
    parser.setLanguage(language)
    const tree = parser.parse(source)
    parser.delete()
    return tree
  } catch {
    return null
  }
}
