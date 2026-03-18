import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { getOrCreateUser } from "@/lib/db/users";
import { getDraftCountForUserThisMonth } from "@/lib/db/usage";
import { getTierLimits } from "@/lib/subscription";
import { UpgradeButton } from "./UpgradeButton";
import { ManageBillingButton } from "./ManageBillingButton";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");
  const tier = (dbUser.subscription_tier as "free" | "founder" | "team") ?? "free";
  const limits = getTierLimits(tier);
  const draftCount = await getDraftCountForUserThisMonth(dbUser.id);
  const hasStripe = !!process.env.STRIPE_PRICE_FOUNDER;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <Sparkles className="h-6 w-6 text-amber-500" />
            <span className="font-semibold">Commitly</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Billing
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Manage your subscription and usage.
        </p>

        <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Current plan: {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Drafts this month
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {draftCount}
                {limits.draftsPerMonth === Infinity ? "" : ` / ${limits.draftsPerMonth}`}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Repo limit
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {limits.repos === Infinity ? "Unlimited" : limits.repos}
              </p>
            </div>
          </div>

          {tier === "founder" || tier === "team" ? (
            <div className="mt-6">
              <ManageBillingButton />
            </div>
          ) : hasStripe ? (
            <div className="mt-6">
              <UpgradeButton />
            </div>
          ) : null}
        </section>

        {hasStripe && tier === "free" && (
          <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
              Upgrade to Founder
            </h2>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              $19/month — Unlimited repos, unlimited drafts, Brand Voice, and Direct Publishing (coming soon).
            </p>
            <UpgradeButton />
          </section>
        )}
      </main>
    </div>
  );
}
