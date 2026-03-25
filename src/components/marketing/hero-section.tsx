import Link from "next/link"
import { ArrowRight, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkflowDiagram } from "./workflow-diagram"

interface HeroSectionProps {
  isSignedIn: boolean
}

export const HeroSection = ({ isSignedIn }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid items-center gap-16 md:grid-cols-2">
          {/* Left: copy */}
          <div className="flex flex-col gap-6">
            {/* Eyebrow */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
              <span
                className="size-1.5 rounded-full bg-brand"
                aria-hidden="true"
              />
              <span className="text-xs font-medium tracking-wide text-muted-foreground">
                Repo-to-release automation
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[44px] font-bold leading-[1.1] tracking-[-0.03em] text-foreground md:text-5xl">
              Stop shipping
              <br />
              in silence.
            </h1>

            {/* Subhead */}
            <p className="text-lg leading-relaxed text-muted-foreground">
              Turn commits into go-to-market drafts. Engineers ship. Commitly AI
              writes. You review and publish.
            </p>

            {/* Pain hook */}
            <p className="text-sm leading-relaxed text-muted-foreground/70">
              Your best features shouldn&apos;t die in a private repo. Automate
              the path from merge to post—without turning engineers into
              copywriters.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              {isSignedIn ? (
                <Button asChild size="lg" className="h-12 rounded-xl px-8">
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="h-12 rounded-xl px-8">
                    <Link href="/signup">
                      Connect GitHub free
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 rounded-xl px-8"
                  >
                    <Link href="/signin">Sign in</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Micro-trust */}
            <p className="text-xs text-muted-foreground/50">
              Reads repo contents and webhooks only. You review before anything
              ships.
            </p>
          </div>

          {/* Right: workflow diagram */}
          <div className="hidden items-center justify-end md:flex">
            <WorkflowDiagram />
          </div>
        </div>
      </div>
    </section>
  )
}
