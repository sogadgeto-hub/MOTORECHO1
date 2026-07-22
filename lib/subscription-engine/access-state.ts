import type { PlanAccessSnapshot } from '@/lib/plan-access';
import { mergeSnapshotWithSubscription } from './providers/revenuecat-offerings';
import { fetchRevenueCatSubscription, isRevenueCatAvailable } from './providers/revenuecat';
import {
  applyInternalBetaPremiumSnapshot,
  isInternalBetaPremiumSubscription,
  resolveInternalBetaPremiumAccess,
} from './internal-beta-premium';
import {
  buildManualSubscriptionFromSnapshot,
  hasActiveRevenueCatEntitlement,
  hasPremiumAccess,
} from './subscription';
import type { SubscriptionInfo } from './types';

export type AccessStatePhase =
  | 'bootstrap'
  | 'refresh'
  | 'after_purchase'
  | 'after_analysis'
  | 'after_vehicle'
  | 'before_verify_analyze'
  | 'after_verify_analyze';

/** Snapshot effectif — ré-applique toujours les limites RevenueCat actives. */
export function resolveEffectiveSnapshot(
  baseSnapshot: PlanAccessSnapshot,
  subscription: SubscriptionInfo
): PlanAccessSnapshot {
  if (isInternalBetaPremiumSubscription(subscription)) {
    return applyInternalBetaPremiumSnapshot(baseSnapshot);
  }

  return mergeSnapshotWithSubscription(baseSnapshot, subscription);
}

export function logAccessState(
  phase: AccessStatePhase,
  subscription: SubscriptionInfo,
  baseSnapshot: PlanAccessSnapshot,
  mergedSnapshot: PlanAccessSnapshot
): void {
  if (!__DEV__) return;

  console.log(`[SubscriptionEngine] ${phase}`, {
    rcPlan: subscription.provider === 'revenuecat' ? subscription.plan : null,
    rcEntitlementActive: hasActiveRevenueCatEntitlement(subscription),
    subscriptionPlan: subscription.plan,
    subscriptionProvider: subscription.provider,
    supabasePlan: baseSnapshot.plan,
    mergedPlan: mergedSnapshot.plan,
    monthlyAnalyses: mergedSnapshot.monthlyAnalyses,
    maxAnalyses: mergedSnapshot.maxAnalyses,
    vehicleCount: mergedSnapshot.vehicleCount,
    maxVehicles: mergedSnapshot.maxVehicles,
  });
}

/**
 * RevenueCat reste prioritaire tant qu'un entitlement actif est connu.
 * En cas d'échec réseau transitoire, conserve le dernier entitlement payant.
 */
export async function resolveSubscriptionWithRevenueCatPriority(
  baseSnapshot: PlanAccessSnapshot,
  cachedPaidSubscription: SubscriptionInfo | null,
  options?: { isAuthenticated?: boolean }
): Promise<{ subscription: SubscriptionInfo; cachedPaidSubscription: SubscriptionInfo | null }> {
  const isAuthenticated = options?.isAuthenticated ?? true;
  const betaAccess = resolveInternalBetaPremiumAccess(baseSnapshot, isAuthenticated);

  if (betaAccess) {
    if (__DEV__) {
      console.log('[SubscriptionEngine] Internal beta — Premium access granted (RevenueCat bypassed)');
    }

    return {
      subscription: betaAccess.subscription,
      cachedPaidSubscription: betaAccess.subscription,
    };
  }

  if (isRevenueCatAvailable()) {
    try {
      const revenueCatSubscription = await fetchRevenueCatSubscription();

      if (hasPremiumAccess(revenueCatSubscription)) {
        return {
          subscription: revenueCatSubscription,
          cachedPaidSubscription: revenueCatSubscription,
        };
      }

      if (revenueCatSubscription.provider === 'revenuecat' && revenueCatSubscription.plan === 'free') {
        return {
          subscription: revenueCatSubscription,
          cachedPaidSubscription: null,
        };
      }

      if (cachedPaidSubscription && hasPremiumAccess(cachedPaidSubscription)) {
        if (__DEV__) {
          console.log(
            '[SubscriptionEngine] RevenueCat sans entitlement — conservation du cache payant actif'
          );
        }
        return {
          subscription: cachedPaidSubscription,
          cachedPaidSubscription,
        };
      }

      if (revenueCatSubscription.provider === 'revenuecat') {
        return {
          subscription: revenueCatSubscription,
          cachedPaidSubscription: null,
        };
      }
    } catch {
      if (cachedPaidSubscription && hasPremiumAccess(cachedPaidSubscription)) {
        if (__DEV__) {
          console.log(
            '[SubscriptionEngine] Échec fetch RevenueCat — conservation du cache payant actif'
          );
        }
        return {
          subscription: cachedPaidSubscription,
          cachedPaidSubscription,
        };
      }
    }
  }

  if (cachedPaidSubscription && hasPremiumAccess(cachedPaidSubscription)) {
    return {
      subscription: cachedPaidSubscription,
      cachedPaidSubscription,
    };
  }

  return {
    subscription: buildManualSubscriptionFromSnapshot(baseSnapshot),
    cachedPaidSubscription,
  };
}
