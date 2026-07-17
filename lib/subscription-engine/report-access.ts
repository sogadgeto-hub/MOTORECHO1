import type { UserPlan } from '@/lib/diagnostic-engine';
import type { PlanAccessSnapshot } from '@/lib/plan-access';
import { resolveEffectiveSnapshot } from './access-state';
import { hasGarageAccess, hasPremiumAccess } from './subscription';
import type { SubscriptionInfo } from './types';

export type ReportTier = UserPlan;

const TIER_RANK: Record<ReportTier, number> = {
  free: 0,
  premium: 1,
  garage: 2,
};

/** Plan effectif pour l'affichage — snapshot fusionné + subscription RevenueCat. */
export function getEffectivePlan(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): UserPlan {
  if (hasGarageAccess(subscription)) {
    return 'garage';
  }

  if (hasPremiumAccess(subscription)) {
    return subscription.plan === 'garage' ? 'garage' : 'premium';
  }

  return resolveEffectiveSnapshot(snapshot, subscription).plan;
}

/** Niveau de rapport le plus élevé accessible pour le compte courant. */
export function getHighestAccessibleReportTier(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): ReportTier {
  return getEffectivePlan(subscription, snapshot);
}

/** Un tier de rapport est visible si le plan effectif l'inclut. */
export function canViewReportTier(
  tier: ReportTier,
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): boolean {
  const highest = getHighestAccessibleReportTier(subscription, snapshot);
  return TIER_RANK[tier] <= TIER_RANK[highest];
}

/** Tier affiché automatiquement — égal au plan effectif (RevenueCat prioritaire). */
export function resolveReportTier(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): ReportTier {
  return getEffectivePlan(subscription, snapshot);
}

/** @deprecated Alias — préférer resolveReportTier */
export function getDefaultReportTier(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): ReportTier {
  return resolveReportTier(subscription, snapshot);
}
