import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MarketingNavProps {
  isSignedIn: boolean
}

export const MarketingNav = ({ isSignedIn }: MarketingNavProps) => {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Commitly AI home"
        >
          <div className="flex size-7 items-center justify-center rounded-lg border border-border bg-card">
            <Sparkles className="size-3.5 text-brand" strokeWidth={1.5} />
          </div>
          <span className="text-[15px] font-semibold text-foreground">
            Commitly
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {[
            { label: "Product", href: "#product" },
            { label: "How it works", href: "#how" },
            { label: "FAQ", href: "#faq" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <Button asChild size="sm" className="rounded-xl">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-xl text-muted-foreground hover:text-foreground"
              >
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl">
                <Link href="/signup">Connect GitHub</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
