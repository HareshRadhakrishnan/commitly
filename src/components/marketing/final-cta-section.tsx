import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export const FinalCtaSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <p className="mb-4 text-xs font-medium tracking-widest text-muted-foreground/50 uppercase">
          Get started
        </p>

        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Ready to shorten the distance
          <br className="hidden md:block" />
          between build and buzz?
        </h2>

        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
          Free to start. Fast setup. No sales call required to try.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="h-12 rounded-xl px-8">
            <Link href="/signup">
              Run my workflow audit
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 rounded-xl px-8 text-muted-foreground hover:text-foreground"
          >
            <Link href="/signup?intent=playbook">
              Get the Engineering-to-Growth playbook
            </Link>
          </Button>
        </div>

        {/* Permission reminder */}
        <p className="mt-6 text-xs text-muted-foreground/40">
          Read-only GitHub access. No credit card to start.
        </p>
      </div>
    </section>
  )
}
