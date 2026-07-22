import type { UserPlan } from '@/lib/diagnostic-engine';

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'grace_period'
  | 'expired'
  | 'cancelled';

export type SubscriptionProvider = 'none' | 'revenuecat' | 'stripe' | 'manual' | 'internal_beta';

export type SubscriptionInfo = {
  plan: UserPlan;
  provider: SubscriptionProvider;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  isAutoRenew: boolean;
  isTrial: boolean;
  daysRemaining: number | null;
};

export type PermissionResult = {
  allowed: boolean;
  reason?: string;
};
