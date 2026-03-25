import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/db/users";
import { getDraftCountForUserThisMonth } from "@/lib/db/usage";
import { getTierLimits } from "@/lib/subscription";
import { UpgradeButton } from "./UpgradeButton";
import { ManageBillingButton } from "./ManageBillingButton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and usage.
        </p>
      </div>

      {/* Current plan card */}
      <Card className="rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Current plan</CardTitle>
            <Badge className="bg-brand-muted text-brand hover:bg-brand-muted border-0 text-[11px] font-semibold uppercase tracking-wider">
              {tierLabel}
            </Badge>
          </div>
          <CardDescription>Your usage and limits this billing period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Drafts this month
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {draftCount}
                {limits.draftsPerMonth !== Infinity && (
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}/ {limits.draftsPerMonth}
                  </span>
                )}
              </p>
              {limits.draftsPerMonth !== Infinity && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (draftCount / limits.draftsPerMonth) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Repo limit
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {limits.repos === Infinity ? "Unlimited" : limits.repos}
              </p>
            </div>
          </div>

          {/* Manage / upgrade */}
          {tier === "founder" || tier === "team" ? (
            <ManageBillingButton />
          ) : hasStripe ? (
            <UpgradeButton />
          ) : null}
        </CardContent>
      </Card>

      {/* Upgrade banner for free users */}
      {hasStripe && tier === "free" && (
        <Card className="rounded-2xl border-dashed shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Upgrade to Founder</CardTitle>
            <CardDescription>
              $19/month — Unlimited repos, unlimited drafts, and Brand Voice. Cancel anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpgradeButton />
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Payments are processed securely by Stripe. We never store your card details.
      </p>
    </div>
  );
}
