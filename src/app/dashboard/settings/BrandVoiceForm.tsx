"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { addBrandExample, removeBrandExample } from "./actions";
import type { BrandExample } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await addBrandExample(activePlatform, draft);
      if (result.error) {
        setError(result.error);
        return;
      }
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
    <Tabs
      value={activePlatform}
      onValueChange={(v) => {
        setActivePlatform(v as BrandExample["platform"]);
        setDraft("");
        setError(null);
      }}
      className="gap-6"
    >
      <TabsList className="grid w-full grid-cols-3">
        {PLATFORMS.map((p) => (
          <TabsTrigger key={p.value} value={p.value}>
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {PLATFORMS.map((p) => {
        const forPlatform = examples.filter((e) => e.platform === p.value);
        return (
          <TabsContent key={p.value} value={p.value} className="mt-0 space-y-6">
            <p className="text-sm text-muted-foreground">
              {p.description} Add up to 5 examples — the AI will clone your style when
              generating content.
            </p>

            {forPlatform.length > 0 && (
              <ul className="space-y-3">
                {forPlatform.map((ex, i) => (
                  <li
                    key={ex.id}
                    className="group flex items-start gap-3 rounded-lg border bg-card p-3"
                  >
                    <span className="mt-0.5 text-xs font-semibold text-muted-foreground">
                      #{i + 1}
                    </span>
                    <p className="flex-1 whitespace-pre-wrap text-sm text-foreground">
                      {ex.content}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(ex.id)}
                      disabled={isPending}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Remove example"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {forPlatform.length < 5 ? (
              <div className="space-y-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Paste a ${p.label} example here…`}
                  rows={5}
                  className="min-h-[120px] resize-y"
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="button"
                  onClick={handleAdd}
                  disabled={isPending || !draft.trim()}
                  className="gap-2"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add example
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You&apos;ve added the maximum of 5 examples for this platform.
              </p>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
