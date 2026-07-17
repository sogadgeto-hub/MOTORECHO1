import type { UserPlan } from '@/lib/diagnostic-engine';
import type { PlanAccessSnapshot } from '@/lib/plan-access';
import type { SubscriptionInfo, SubscriptionProvider, SubscriptionStatus } from './types';

const ACTIVE_STATUSES: SubscriptionStatus[] = ['active', 'trial', 'grace_period'];

export function getSubscriptionStatus(
  info: SubscriptionInfo,
  now: Date = new Date()
): SubscriptionStatus {
  if (info.status === 'cancelled') {
    return 'cancelled';
  }

  if (info.endDate) {
    const end = new Date(info.endDate);
    if (now > end) {
      return 'expired';
    }
  }

  if (info.isTrial) {
    return 'trial';
  }

  if (info.status === 'grace_period') {
    return 'grace_period';
  }

  if (info.status === 'expired') {
    return 'expired';
  }

  return 'active';
}

export function isSubscriptionActive(
  info: SubscriptionInfo,
  now: Date = new Date()
): boolean {
  const status = getSubscriptionStatus(info, now);

  if (status === 'cancelled' || status === 'expired') {
    return false;
  }

  if (info.plan === 'free' && info.provider === 'none') {
    return true;
  }

  return ACTIVE_STATUSES.includes(status);
}

export function hasPremiumAccess(
  info: SubscriptionInfo,
  now: Date = new Date()
): boolean {
  if (!isSubscriptionActive(info, now)) {
    return false;
  }

  return info.plan === 'premium' || info.plan === 'garage';
}

export function hasGarageAccess(
  info: SubscriptionInfo,
  now: Date = new Date()
): boolean {
  if (!isSubscriptionActive(info, now)) {
    return false;
  }

  return info.plan === 'garage';
}

/** Entitlement RevenueCat actif (premium ou garage) — autorité client avant sync Supabase. */
export function hasActiveRevenueCatEntitlement(
  info: SubscriptionInfo,
  now: Date = new Date()
): boolean {
  return info.provider === 'revenuecat' && hasPremiumAccess(info, now);
}

export function daysUntilExpiration(
  info: SubscriptionInfo,
  now: Date = new Date()
): number | null {
  if (info.daysRemaining !== null) {
    return Math.max(0, info.daysRemaining);
  }

  if (!info.endDate) {
    return null;
  }

  const end = new Date(info.endDate);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function canRenew(
  info: SubscriptionInfo,
  now: Date = new Date()
): boolean {
  const status = getSubscriptionStatus(info, now);

  if (info.plan === 'free' && info.provider === 'none') {
    return true;
  }

  if (status === 'expired' || status === 'cancelled') {
    return true;
  }

  if (!info.isAutoRenew && info.endDate) {
    const days = daysUntilExpiration(info, now);
    return days !== null && days <= 7;
  }

  return false;
}

/** Construit un abonnement manuel à partir d'un snapshot plan-access (sans provider externe). */
export function buildManualSubscriptionFromSnapshot(
  snapshot: PlanAccessSnapshot,
  options?: {
    provider?: SubscriptionProvider;
    endDate?: string | null;
    isTrial?: boolean;
  }
): SubscriptionInfo {
  const plan: UserPlan = snapshot.plan;
  const isPaid = plan === 'premium' || plan === 'garage';
  const endDate = options?.endDate ?? null;
  const provider = options?.provider ?? 'manual';

  const info: SubscriptionInfo = {
    plan,
    provider,
    status: 'active',
    startDate: null,
    endDate,
    renewalDate: endDate,
    isAutoRenew: isPaid,
    isTrial: options?.isTrial ?? false,
    daysRemaining: null,
  };

  info.daysRemaining = daysUntilExpiration(info);

  return info;
}

/** Abonnement free par défaut — aucun provider de paiement. */
export function createFreeSubscription(): SubscriptionInfo {
  return {
    plan: 'free',
    provider: 'none',
    status: 'active',
    startDate: null,
    endDate: null,
    renewalDate: null,
    isAutoRenew: false,
    isTrial: false,
    daysRemaining: null,
  };
}
