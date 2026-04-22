import path from "path"
import { grammarForPath, parseSource } from "./parser"

// ── Public types ──────────────────────────────────────────────────────────────

export type EntryPointKind = "api-route" | "inngest-fn" | "page" | "layout"

export type EntryPoint = {
  path: string
  kind: EntryPointKind
}

export type CoreModule = {
  path: string
  importerCount: number
  exportedSymbols: string[]
}

export type ImportGraph = {
  /** entry points detected by file path pattern */
  entryPoints: EntryPoint[]
  /** top-10 most-imported files (highest centrality first) */
  coreModules: CoreModule[]
  /** file → list of repo-internal files it imports */
  importGraph: Record<string, string[]>
  /** file → list of repo-internal files that import it */
  importedBy: Record<string, string[]>
}

// ── Entry point detection (path-based, no parsing needed) ────────────────────

const ENTRY_POINT_PATTERNS: { re: RegExp; kind: EntryPointKind }[] = [
  { re: /^src\/app\/api\/.+\/route\.[jt]sx?$/, kind: "api-route" },
  { re: /^src\/inngest\/functions\/.+\.[jt]sx?$/, kind: "inngest-fn" },
  { re: /^src\/app\/.+\/layout\.[jt]sx?$/, kind: "layout" },
  { re: /^src\/app\/.+\/page\.[jt]sx?$/, kind: "page" },
]

export function detectEntryPoints(filePaths: string[]): EntryPoint[] {
  const results: EntryPoint[] = []
  for (const p of filePaths) {
    const normalised = p.replace(/\\/g, "/")
    for (const { re, kind } of ENTRY_POINT_PATTERNS) {
      if (re.test(normalised)) {
        results.push({ path: normalised, kind })
        break
      }
    }
  }
  return results
}

// ── Import extraction via Tree-sitter ─────────────────────────────────────────

/**
 * Resolves an import specifier to a canonical repo-relative path.
 *
 * Rules:
 *   "@/foo/bar"  → "src/foo/bar.ts"  (Next.js path alias)
 *   "./bar"      → resolved relative to the importing file's directory
 *   "../bar"     → same, one level up
 *   "react"      → null (external package — skip)
 *
 * The resolved path is normalised to forward slashes and will match the
 * file paths returned by the GitHub tree API.
 */
function resolveImport(specifier: string, importingFile: string): string | null {
  // External npm packages — not useful for the graph
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null

  let resolved: string
  if (specifier.startsWith("@/")) {
    resolved = "src/" + specifier.slice(2)
  } else {
    const dir = path.posix.dirname(importingFile.replace(/\\/g, "/"))
    resolved = path.posix.join(dir, specifier)
  }

  // Strip leading "./" if join left it
  if (resolved.startsWith("./")) resolved = resolved.slice(2)

  // Normalise — the GitHub tree lists files with their real extension.
  // If the specifier already has an extension, honour it; otherwise the
  // caller will look it up against the known file list.
  return resolved.replace(/\\/g, "/")
}

/**
 * Extracts the repo-internal import targets from a single file using
 * Tree-sitter. Falls back to a simple regex scan when the file is not
 * TS/JS/TSX (Python, Go, etc.) or when parsing fails.
 */
export async function extractFileImports(
  filePath: string,
  content: string,
  knownFiles: Set<string>,
): Promise<string[]> {
  const grammar = grammarForPath(filePath)

  const specifiers: string[] = []

  if (grammar) {
    // Tree-sitter path: walk import_statement and export_statement nodes
    const tree = await parseSource(content, grammar)
    if (tree) {
      for (const child of tree.rootNode.namedChildren) {
        if (!child) continue
        if (child.type !== "import_statement" && child.type !== "export_statement") continue

        // The module specifier is the string literal node named "source"
        const sourceNode = child.namedChildren.find(
          (n) => n?.type === "string" || n?.type === "string_fragment",
        )
        const raw = sourceNode?.text?.replace(/^['"`]|['"`]$/g, "")
        if (raw) specifiers.push(raw)
      }
      tree.delete()
    }
  } else {
    // Regex fallback for non-TS/JS files (catches Python-style or simple JS)
    const importRe = /(?:^|\n)\s*(?:import|from)\s+['"]([^'"]+)['"]/g
    let m: RegExpExecArray | null
    while ((m = importRe.exec(content)) !== null) {
      specifiers.push(m[1])
    }
  }

  // Resolve each specifier and verify it exists in the indexed file set
  const resolved: string[] = []
  for (const spec of specifiers) {
    const base = resolveImport(spec, filePath)
    if (!base) continue

    // Try common extensions when the specifier has no extension
    const candidates = base.includes(".")
      ? [base]
      : [
          base + ".ts",
          base + ".tsx",
          base + ".js",
          base + ".jsx",
          base + "/index.ts",
          base + "/index.tsx",
          base + "/index.js",
        ]

    for (const candidate of candidates) {
      if (knownFiles.has(candidate)) {
        resolved.push(candidate)
        break
      }
    }
  }

  return [...new Set(resolved)]
}

// ── Exported symbol extraction (lightweight) ──────────────────────────────────

/**
 * Returns the names of top-level exported symbols from a file using a simple
 * regex scan. Used to populate CoreModule.exportedSymbols without a full CST
 * walk (the full walk happens during chunking anyway).
 */
function extractExportedSymbols(content: string): string[] {
  const names: string[] = []
  // export function foo / export const foo / export class Foo / export type Foo / export interface Foo
  const re = /^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|type|interface|enum)\s+(\w+)/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    names.push(m[1])
  }
  return [...new Set(names)]
}

// ── Main graph builder ────────────────────────────────────────────────────────

/**
 * Builds the full import graph for a repo given the list of indexed files and
 * their content. Designed to run inside an Inngest step where content is
 * already in memory.
 *
 * Algorithm:
 *   1. Detect entry points by path pattern
 *   2. For each TS/JS/TSX file, extract its internal imports
 *   3. Build forward (importGraph) and reverse (importedBy) adjacency maps
 *   4. Rank files by importer count → top-10 become coreModules
 */
export async function buildImportGraph(
  files: { path: string; content: string }[],
): Promise<ImportGraph> {
  const knownFiles = new Set(files.map((f) => f.path.replace(/\\/g, "/")))
  const contentMap = new Map(files.map((f) => [f.path.replace(/\\/g, "/"), f.content]))

  // Step 1: entry points
  const entryPoints = detectEntryPoints([...knownFiles])

  // Step 2: extract imports per file
  const importGraph: Record<string, string[]> = {}
  const importedBy: Record<string, string[]> = {}

  // Initialise importedBy for all known files (so files with 0 importers appear)
  for (const fp of knownFiles) {
    importedBy[fp] = []
  }

  for (const fp of knownFiles) {
    const content = contentMap.get(fp) ?? ""
    const imports = await extractFileImports(fp, content, knownFiles)
    importGraph[fp] = imports

    for (const target of imports) {
      if (!importedBy[target]) importedBy[target] = []
      if (!importedBy[target].includes(fp)) {
        importedBy[target].push(fp)
      }
    }
  }

  // Step 3: rank by importer count, take top 10
  const ranked = [...knownFiles]
    .map((fp) => ({
      path: fp,
      importerCount: importedBy[fp]?.length ?? 0,
      exportedSymbols: extractExportedSymbols(contentMap.get(fp) ?? ""),
    }))
    .filter((f) => f.importerCount > 0)
    .sort((a, b) => b.importerCount - a.importerCount)
    .slice(0, 10)

  return {
    entryPoints,
    coreModules: ranked,
    importGraph,
    importedBy,
  }
}

// ── Formatting helpers used by prompts ───────────────────────────────────────

/**
 * Renders the ImportGraph as a compact text block suitable for inclusion in
 * LLM prompts. Keeps token cost low (~100-200 tokens for a typical repo).
 */
export function formatCodeGraph(graph: ImportGraph): string {
  const lines: string[] = []

  if (graph.entryPoints.length > 0) {
    lines.push("Entry points:")
    for (const ep of graph.entryPoints) {
      lines.push(`  [${ep.kind}] ${ep.path}`)
    }
  }

  if (graph.coreModules.length > 0) {
    lines.push("Most-imported modules (centrality rank):")
    for (const m of graph.coreModules) {
      const symbols = m.exportedSymbols.slice(0, 5).join(", ")
      const symbolNote = symbols ? ` — exports: ${symbols}` : ""
      lines.push(`  ${m.path} (imported by ${m.importerCount} files)${symbolNote}`)
    }
  }

  return lines.join("\n")
}
