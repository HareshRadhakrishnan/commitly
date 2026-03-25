type CommitEntry = {
  message: string
  status: "filtered" | "drafted"
  time: string
}

const commits: CommitEntry[] = [
  { message: "feat: add CSV export for reports dashboard", status: "drafted", time: "2h ago" },
  { message: "chore: bump react-query to v5", status: "filtered", time: "5h ago" },
  { message: "fix: typo in login error copy", status: "filtered", time: "6h ago" },
  { message: "refactor: extract auth helpers to shared util", status: "filtered", time: "1d ago" },
  { message: "style: fix button padding in mobile nav", status: "filtered", time: "1d ago" },
  { message: "docs: update API setup instructions", status: "filtered", time: "2d ago" },
]

export const SplitSection = () => {
  return (
    <section id="product" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground/50 uppercase">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            From commit noise to customer language.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Engineers shouldn&apos;t be copywriters. Commitly AI identifies
            user-facing changes and drafts the proof—not the jargon.
          </p>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left: commit log */}
          <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-zinc-700" />
                <span className="size-2.5 rounded-full bg-zinc-700" />
                <span className="size-2.5 rounded-full bg-zinc-700" />
              </div>
              <span className="ml-2 font-mono text-xs text-muted-foreground/60">
                git log --oneline
              </span>
            </div>
            <div className="flex-1 p-5">
              <ul className="space-y-2" role="list" aria-label="Recent commits">
                {commits.map(({ message, status, time }) => (
                  <li
                    key={message}
                    className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5"
                    style={{
                      background:
                        status === "drafted"
                          ? "rgba(167,139,250,0.08)"
                          : "transparent",
                    }}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="mt-0.5 shrink-0 text-[10px]"
                        aria-label={status === "drafted" ? "Drafted" : "Filtered"}
                      >
                        {status === "drafted" ? (
                          <span className="text-brand">→</span>
                        ) : (
                          <span className="text-zinc-600">–</span>
                        )}
                      </span>
                      <span
                        className="truncate font-mono text-xs leading-relaxed"
                        style={{
                          color:
                            status === "drafted"
                              ? "#fafafa"
                              : "rgba(161,161,170,0.4)",
                          textDecoration:
                            status === "filtered" ? "line-through" : "none",
                        }}
                      >
                        {message}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-zinc-700">
                      {time}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-border pt-3">
                <p className="font-mono text-[10px] text-muted-foreground/40">
                  5 commits filtered · 1 draft generated
                </p>
              </div>
            </div>
          </div>

          {/* Right: LinkedIn draft */}
          <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
                <span className="text-xs font-medium text-muted-foreground">
                  LinkedIn draft
                </span>
              </div>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground/60">
                Ready to review
              </span>
            </div>
            <div className="flex-1 p-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground/40">
                Generated from: feat: add CSV export
              </p>
              <div className="space-y-3 text-sm leading-relaxed text-foreground">
                <p>
                  We just shipped CSV export for the reports dashboard.
                </p>
                <p className="text-muted-foreground">
                  Your team can now download data from any dashboard view with
                  one click. No more manual copy-paste. No more screenshot
                  chains.
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>→ Works across all date ranges</li>
                  <li>→ Exports in seconds</li>
                  <li>→ Available to all plans today</li>
                </ul>
                <p className="text-muted-foreground/70">
                  We build in public. This shipped because customers asked for
                  it.
                </p>
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/50">
                    Edit before publishing
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
                    <span className="text-xs font-medium text-brand">
                      Copy to clipboard
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
