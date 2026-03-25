const problems = [
  {
    label: "Rising acquisition costs",
    heading: "CAC keeps climbing.",
    body: "While your product keeps improving—quietly, invisibly. The value is there. The signal isn't.",
  },
  {
    label: "Generic tools, generic results",
    heading: "\"AI everywhere, outcomes nowhere.\"",
    body: "Busy dashboards don't close deals. Blast-posting noise doesn't build trust.",
  },
  {
    label: "Motion without velocity",
    heading: "Lots of activity. Few outcomes.",
    body: "Teams ship great work. None of it becomes marketing. The gap costs you compound interest.",
  },
]

export const ProblemSection = () => {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground/50 uppercase">
            The problem
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            The cost of invisible progress.
          </h2>
        </div>

        <div className="grid gap-px md:grid-cols-3">
          {problems.map(({ label, heading, body }) => (
            <div
              key={label}
              className="flex flex-col gap-3 border border-border bg-card p-8 first:rounded-tl-2xl first:rounded-bl-2xl last:rounded-tr-2xl last:rounded-br-2xl md:first:rounded-l-2xl md:last:rounded-r-2xl md:[&:not(:first-child):not(:last-child)]:rounded-none"
            >
              <span className="text-xs font-medium tracking-wide text-muted-foreground/50 uppercase">
                {label}
              </span>
              <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">
                {heading}
              </h3>
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
