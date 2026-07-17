import type { PlanAccessSnapshot } from '@/lib/plan-access';
import type { SubscriptionInfo } from './types';
import { hasActiveRevenueCatEntitlement } from './subscription';

export type PlanSyncState = 'aligned' | 'revenuecat_ahead' | 'server_ahead';

/**
 * Compare l'entitlement RevenueCat au snapshot Supabase.
 * Point d'extension futur : webhook RevenueCat → Supabase (profiles.plan_type).
 */
export function getPlanSyncState(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): PlanSyncState {
  const rcPaid = hasActiveRevenueCatEntitlement(subscription);

  if (rcPaid && snapshot.plan === 'free') {
    return 'revenuecat_ahead';
  }

  if (!rcPaid && snapshot.plan !== 'free' && subscription.plan === 'free') {
    return 'server_ahead';
  }

  if (rcPaid && subscription.plan !== snapshot.plan) {
    return 'revenuecat_ahead';
  }

  return 'aligned';
}

/** Indique si la validation serveur RPC peut être contournée côté client (Test Store). */
export function shouldBypassServerPlanCheck(subscription: SubscriptionInfo): boolean {
  return hasActiveRevenueCatEntitlement(subscription);
}
