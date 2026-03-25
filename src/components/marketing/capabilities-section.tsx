import { Zap, Layers, Mic2 } from "lucide-react"

const capabilities = [
  {
    icon: Zap,
    title: "Significance Filter",
    description:
      "Skips typo fixes, refactors, and dependency bumps. Surfaces only the changes customers can feel—user-facing features and functional improvements.",
    outcome: "Only alerts when it's worth messaging.",
  },
  {
    icon: Layers,
    title: "Multi-Platform Drafts",
    description:
      "One significant push generates a LinkedIn post, an X thread, and a benefit-led changelog entry. Consistent voice, one review pass, three channels.",
    outcome: "Consistent voice across every channel.",
  },
  {
    icon: Mic2,
    title: "Brand Voice Cloning",
    description:
      "Paste three to five example posts. Commitly AI learns your tone, sentence structure, and vocabulary—so drafts sound like you wrote them, not a template.",
    outcome: "Sounds like you, not like AI.",
  },
]

export const CapabilitiesSection = () => {
  return (
    <section id="product" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground/50 uppercase">
            What it does
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Built around your delivery pipeline.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Not a generic prompt box. Not a chat interface bolted onto your
            repo. Each feature maps to a specific part of the commit-to-market
            workflow.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, description, outcome }) => (
            <div
              key={title}
              className="group flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 transition-colors duration-150 hover:border-border/80 hover:bg-card"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-background">
                <Icon className="size-4 text-brand" strokeWidth={1.5} />
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>

              {/* Outcome pill */}
              <div className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1">
                <span
                  className="size-1.5 rounded-full bg-brand"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {outcome}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
