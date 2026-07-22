import { isBetaDiagnosticsEnabled } from '@/lib/beta-diagnostics';
import type { PlanAccessSnapshot } from '@/lib/plan-access';
import type { SubscriptionInfo } from './types';

/** Dev + bêta interne uniquement — jamais actif en production store. */
export function isInternalBetaPremiumEnabled(): boolean {
  return isBetaDiagnosticsEnabled();
}

export function isInternalBetaPremiumSubscription(subscription: SubscriptionInfo): boolean {
  return (
    isInternalBetaPremiumEnabled() &&
    subscription.provider === 'internal_beta' &&
    subscription.plan === 'premium'
  );
}

export function createInternalBetaPremiumSubscription(): SubscriptionInfo {
  return {
    plan: 'premium',
    provider: 'internal_beta',
    status: 'active',
    startDate: null,
    endDate: null,
    renewalDate: null,
    isAutoRenew: false,
    isTrial: false,
    daysRemaining: null,
  };
}

/** Premium bêta : véhicules et analyses illimités, droits IA avancée + PDF. */
export function applyInternalBetaPremiumSnapshot(
  baseSnapshot: PlanAccessSnapshot
): PlanAccessSnapshot {
  return {
    ...baseSnapshot,
    plan: 'premium',
    maxVehicles: -1,
    maxAnalyses: -1,
  };
}

export function resolveInternalBetaPremiumAccess(
  baseSnapshot: PlanAccessSnapshot,
  isAuthenticated: boolean
): { subscription: SubscriptionInfo; snapshot: PlanAccessSnapshot } | null {
  if (!isInternalBetaPremiumEnabled() || !isAuthenticated) {
    return null;
  }

  const subscription = createInternalBetaPremiumSubscription();
  return {
    subscription,
    snapshot: applyInternalBetaPremiumSnapshot(baseSnapshot),
  };
}
