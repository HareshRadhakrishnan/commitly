export type SubscriptionTier = "free" | "founder" | "team";

export const TIER_LIMITS: Record<
  SubscriptionTier,
  { repos: number; draftsPerMonth: number }
> = {
  free: { repos: 1, draftsPerMonth: 3 },
  founder: { repos: Infinity, draftsPerMonth: Infinity },
  team: { repos: Infinity, draftsPerMonth: Infinity },
};

export function getTierLimits(tier: SubscriptionTier | null | undefined) {
  const t = tier && TIER_LIMITS[tier as SubscriptionTier] ? (tier as SubscriptionTier) : "free";
  return TIER_LIMITS[t];
}

export function canCreateDraft(
  tier: SubscriptionTier | null | undefined,
  currentDraftCount: number
): boolean {
  const { draftsPerMonth } = getTierLimits(tier);
  return currentDraftCount < draftsPerMonth;
}

export function canConnectRepo(
  tier: SubscriptionTier | null | undefined,
  currentRepoCount: number
): boolean {
  const { repos } = getTierLimits(tier);
  return currentRepoCount < repos;
}
