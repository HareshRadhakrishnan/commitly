"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { addBrandExample, removeBrandExample } from "./actions";
import type { BrandExample } from "@/lib/db/types";

const PLATFORMS: { value: BrandExample["platform"]; label: string; description: string }[] = [
  {
    value: "linkedin",
    label: "LinkedIn",
    description: "Paste a LinkedIn post you've written that captures your voice.",
  },
  {
    value: "twitter",
    label: "Twitter / X",
    description: "Paste a tweet or thread you've written.",
  },
  {
    value: "changelog",
    label: "Changelog",
    description: "Paste a changelog entry you've written.",
  },
];

type Props = {
  initialExamples: BrandExample[];
};

export function BrandVoiceForm({ initialExamples }: Props) {
  const [examples, setExamples] = useState<BrandExample[]>(initialExamples);
  const [activePlatform, setActivePlatform] = useState<BrandExample["platform"]>("linkedin");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const platformExamples = examples.filter((e) => e.platform === activePlatform);

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await addBrandExample(activePlatform, draft);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Optimistically add a placeholder; page revalidation will sync real data
      setExamples((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          user_id: "",
          content: draft.trim(),
          platform: activePlatform,
          created_at: new Date().toISOString(),
        },
      ]);
      setDraft("");
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeBrandExample(id);
      setExamples((prev) => prev.filter((e) => e.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      {/* Platform tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            onClick={() => setActivePlatform(p.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activePlatform === p.value
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {PLATFORMS.find((p) => p.value === activePlatform)?.description}{" "}
        Add up to 5 examples — the AI will clone your style when generating content.
      </p>

      {/* Existing examples */}
      {platformExamples.length > 0 && (
        <ul className="space-y-3">
          {platformExamples.map((ex, i) => (
            <li
              key={ex.id}
              className="group flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span className="mt-0.5 text-xs font-semibold text-zinc-400">#{i + 1}</span>
              <p className="flex-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {ex.content}
              </p>
              <button
                onClick={() => handleRemove(ex.id)}
                disabled={isPending}
                className="mt-0.5 shrink-0 text-zinc-300 transition hover:text-red-500 disabled:opacity-50 dark:text-zinc-600 dark:hover:text-red-400"
                aria-label="Remove example"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new example */}
      {platformExamples.length < 5 && (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Paste a ${PLATFORMS.find((p) => p.value === activePlatform)?.label} example here…`}
            rows={5}
            className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            onClick={handleAdd}
            disabled={isPending || !draft.trim()}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add example
          </button>
        </div>
      )}

      {platformExamples.length >= 5 && (
        <p className="text-sm text-zinc-500">
          You&apos;ve added the maximum of 5 examples for this platform.
        </p>
      )}
    </div>
  );
}
