import { auth } from "@/auth"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { HeroSection } from "@/components/marketing/hero-section"
import { ProblemSection } from "@/components/marketing/problem-section"
import { SplitSection } from "@/components/marketing/split-section"
import { ShiftSection } from "@/components/marketing/shift-section"
import { HowSection } from "@/components/marketing/how-section"
import { CapabilitiesSection } from "@/components/marketing/capabilities-section"
import { ProofSection } from "@/components/marketing/proof-section"
import { FaqSection } from "@/components/marketing/faq-section"
import { FinalCtaSection } from "@/components/marketing/final-cta-section"

export default async function Home() {
  const session = await auth()
  const isSignedIn = !!session?.user

  return (
    // Force dark mode for the marketing page only.
    // ThemeProvider controls the dashboard; this wrapper overrides for /.
    <div className="dark">
      <div className="min-h-screen bg-background text-foreground">
        <MarketingNav isSignedIn={isSignedIn} />
        <main>
          <HeroSection isSignedIn={isSignedIn} />
          <ProblemSection />
          <SplitSection />
          <ShiftSection />
          <HowSection />
          <CapabilitiesSection />
          <ProofSection />
          <FaqSection />
          <FinalCtaSection />
        </main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Commitly AI
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
