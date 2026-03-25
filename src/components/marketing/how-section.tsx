import { Github, Filter, Send } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Github,
    heading: "Audit what's shipping.",
    body: "Connect GitHub with read-only access. Commitly AI sees what's moving through your repos—commits, diffs, and push events.",
    detail: "Setup takes under 3 minutes.",
  },
  {
    number: "02",
    icon: Filter,
    heading: "Cut waste at the source.",
    body: "The significance filter discards typo fixes, refactors, and chores. You only get alerted when a commit carries user-facing value.",
    detail: "No configuration required.",
  },
  {
    number: "03",
    icon: Send,
    heading: "Drafts land in your inbox.",
    body: "A LinkedIn post, X thread, and changelog entry arrive ready to edit. Copy, tweak, publish. Done.",
    detail: "Runs automatically on every push.",
  },
]

export const HowSection = () => {
  return (
    <section id="how" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground/50 uppercase">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Three steps. Zero babysitting.
          </h2>
        </div>

        <div className="relative grid gap-4 md:grid-cols-3">
          {/* Connector line on desktop */}
          <div
            className="absolute top-8 hidden h-px w-full bg-gradient-to-r from-transparent via-border to-transparent md:block"
            aria-hidden="true"
          />

          {steps.map(({ number, icon: Icon, heading, body, detail }) => (
            <div
              key={number}
              className="relative flex flex-col gap-5 rounded-2xl border border-border bg-card p-6"
            >
              {/* Step number badge */}
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                  <Icon className="size-4 text-brand" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-xs font-semibold tracking-widest text-muted-foreground/40">
                  {number}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold leading-snug text-foreground">
                  {heading}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>

              <p className="mt-auto text-xs text-muted-foreground/50">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
