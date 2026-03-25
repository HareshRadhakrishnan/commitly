"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

type FaqItem = {
  q: string
  a: string
}

const faqs: FaqItem[] = [
  {
    q: "Will this spam my followers with technical jargon?",
    a: "No. The significance filter skips invisible work—typo fixes, refactors, dependency bumps. Drafts focus on user-facing value: features customers can feel, improvements they benefit from. You also review and edit every draft before it goes anywhere.",
  },
  {
    q: "Is my code secure?",
    a: "Commitly AI requests Contents: Read and Webhooks permissions only. We process commit diffs to understand context, but we have no write access and we never store your source code. Your proprietary logic stays yours.",
  },
  {
    q: "I don't have time to set up another tool.",
    a: "Most teams are connected in under 3 minutes. Install the GitHub App, choose your repos, paste a few example posts for brand voice, and Commitly AI runs on every push. There's no migration, no new workflow to learn.",
  },
  {
    q: "Is this just another AI wrapper?",
    a: "It's built around your delivery pipeline—diffs, commits, push events—not a generic chat prompt. Commitly AI understands the why behind your changes, not just the message string. The significance filter is the core IP, not the model.",
  },
  {
    q: "\"AI is unreliable.\"",
    a: "You approve every draft. Automation proposes; you publish. Nothing reaches your audience without your explicit action. The AI is a first-pass copywriter, not an autopilot.",
  },
  {
    q: "\"Migration is painful.\"",
    a: "There's nothing to migrate. Connect GitHub, choose which repos to watch, and set your brand voice. Your existing tools stay exactly as they are.",
  },
  {
    q: "\"This looks complex to set up.\"",
    a: "One GitHub App installation. One brand voice configuration. Everything else runs automatically. If a push doesn't contain user-facing value, you won't hear from Commitly AI.",
  },
]

export const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleToggle(index)
    }
  }

  return (
    <section id="faq" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-10">
          <p className="mb-3 text-xs font-medium tracking-widest text-muted-foreground/50 uppercase">
            Objections
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Common questions.
          </h2>
        </div>

        <div className="divide-y divide-border" role="list">
          {faqs.map(({ q, a }, index) => {
            const isOpen = openIndex === index
            const answerId = `faq-answer-${index}`
            const triggerId = `faq-trigger-${index}`

            return (
              <div key={q} role="listitem">
                <button
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => handleToggle(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="flex w-full items-start justify-between gap-4 py-5 text-left transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span
                    className="text-sm font-medium leading-relaxed"
                    style={{ color: isOpen ? "#fafafa" : "#a1a1aa" }}
                  >
                    {q}
                  </span>
                  <span
                    className="mt-0.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  >
                    {isOpen ? (
                      <Minus className="size-4" strokeWidth={1.5} />
                    ) : (
                      <Plus className="size-4" strokeWidth={1.5} />
                    )}
                  </span>
                </button>

                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={triggerId}
                  hidden={!isOpen}
                >
                  <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    {a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
