import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Prevent webpack from trying to bundle WASM packages.
  // These are loaded at runtime from public/wasm/ via fs.readFile.
  serverExternalPackages: ["web-tree-sitter", "tree-sitter-wasms"],
}

export default nextConfig
