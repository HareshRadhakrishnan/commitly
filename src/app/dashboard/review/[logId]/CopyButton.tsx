"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-4" />
          Copy
        </>
      )}
    </button>
  );
}
