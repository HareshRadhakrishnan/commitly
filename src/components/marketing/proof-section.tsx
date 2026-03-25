import { Timer, CheckCircle, Lock } from "lucide-react"

const proofItems = [
  {
    icon: Timer,
    heading: "Merge to message.",
    body: "The gap between shipping and communicating shrinks from days to minutes. Your changelog stays current. Your audience stays informed.",
  },
  {
    icon: CheckCircle,
    heading: "Review before anything ships.",
    body: "Drafts are suggestions, not scheduled posts. Every piece of copy waits for your approval before it ever reaches a customer.",
  },
  {
    icon: Lock,
    heading: "Read-only. Always.",
    body: "Commitly AI requests Contents: Read and Webhooks permissions. No write access to your codebase. No surprises.",
  },
]

const operationalFacts = [
  "Fewer context switches.",
  "One inbox. One review loop.",
  "No write access to your codebase.",
  "Works with any GitHub repo.",
  "Setup in under 3 minutes.",
]

export const ProofSection = () => {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground/50 uppercase">
            What good looks like
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            No vanity metrics. Just outcomes.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Teams use Commitly AI to shorten the gap between merge and message—not
            to inflate a dashboard.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {proofItems.map(({ icon: Icon, heading, body }) => (
            <div
              key={heading}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <Icon
                className="size-5 text-brand"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  {heading}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Operational facts strip */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-border bg-card px-6 py-5">
          {operationalFacts.map((fact) => (
            <div key={fact} className="flex items-center gap-2">
              <span
                className="size-1 rounded-full bg-brand"
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground">{fact}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
