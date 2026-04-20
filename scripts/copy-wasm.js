// Copies WASM binaries needed by web-tree-sitter into public/wasm/ so they
// are always available on Vercel (public/ is always deployed) and during
// local development, without relying on webpack bundling binary files.
const fs = require("fs")
const path = require("path")

const root = path.join(__dirname, "..")
const dest = path.join(root, "public", "wasm")

fs.mkdirSync(dest, { recursive: true })

const copies = [
  [
    // web-tree-sitter 0.25.x uses tree-sitter.wasm; 0.26.x used web-tree-sitter.wasm.
    // Always copy whatever exists under the runtime's own package so locateFile can find it.
    path.join(root, "node_modules", "web-tree-sitter", "tree-sitter.wasm"),
    path.join(dest, "tree-sitter.wasm"),
  ],
  [
    path.join(root, "node_modules", "tree-sitter-wasms", "out", "tree-sitter-javascript.wasm"),
    path.join(dest, "tree-sitter-javascript.wasm"),
  ],
  [
    path.join(root, "node_modules", "tree-sitter-wasms", "out", "tree-sitter-typescript.wasm"),
    path.join(dest, "tree-sitter-typescript.wasm"),
  ],
  [
    path.join(root, "node_modules", "tree-sitter-wasms", "out", "tree-sitter-tsx.wasm"),
    path.join(dest, "tree-sitter-tsx.wasm"),
  ],
]

for (const [src, target] of copies) {
  if (!fs.existsSync(src)) {
    console.warn(`[copy-wasm] WARNING: source not found: ${src}`)
    continue
  }
  fs.copyFileSync(src, target)
  const kb = Math.round(fs.statSync(target).size / 1024)
  console.log(`[copy-wasm] copied ${path.basename(target)} (${kb} KB)`)
}
