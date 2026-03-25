import { GitBranch, Eye, ShieldCheck } from "lucide-react"

const shifts = [
  {
    icon: GitBranch,
    label: "Connected pipeline",
    heading: "Git activity triggers a structured review.",
    body: "Not a random chat prompt. Not a weekly manual task. Every significant push queues a draft automatically.",
  },
  {
    icon: Eye,
    label: "Demo-led growth",
    heading: "Ship updates you can show.",
    body: "Clearer posts. Clearer releases. Faster iteration loops. Your changelog becomes a growth surface.",
  },
  {
    icon: ShieldCheck,
    label: "Guardrails by design",
    heading: "Noise never becomes a draft.",
    body: "If a commit isn't meaningful to customers, it doesn't pass the filter. You only see signal.",
  },
]

export const ShiftSection = () => {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground/50 uppercase">
            A new way
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            A workflow you can trust.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Not another tool you have to babysit. A pipeline that runs, filters,
            and drafts—then waits for your approval.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {shifts.map(({ icon: Icon, label, heading, body }) => (
            <div
              key={label}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-background">
                <Icon className="size-4 text-brand" strokeWidth={1.5} />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground/60 uppercase">
                  {label}
                </p>
                <h3 className="text-base font-semibold leading-snug text-foreground">
                  {heading}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
