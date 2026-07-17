import { canAccessDetailedDiagnostic, checkServerPlanLimit, type PlanAccessValidation } from '@/lib/plan-access';
import type { PlanAccessSnapshot } from '@/lib/plan-access';
import type { UserPlan } from '@/lib/diagnostic-engine';
import {
  checkAnalysisLimit,
  checkDetailedDiagnosticLimit,
  checkVehicleLimit,
} from './limits';
import { resolveEffectiveSnapshot } from './access-state';
import { getPlanSyncState, shouldBypassServerPlanCheck } from './server-sync';
import {
  hasGarageAccess,
  hasPremiumAccess,
  isSubscriptionActive,
} from './subscription';
import type { PermissionResult, SubscriptionInfo } from './types';

function fromPlanValidation(
  validation: { allowed: boolean; reason?: string },
  inactiveReason: string
): PermissionResult {
  if (!validation.allowed) {
    return {
      allowed: false,
      reason: validation.reason ?? inactiveReason,
    };
  }

  return { allowed: true };
}

function requireActiveSubscription(info: SubscriptionInfo): PermissionResult | null {
  if (!isSubscriptionActive(info)) {
    return {
      allowed: false,
      reason: 'Subscription is not active',
    };
  }

  return null;
}

export function canAddVehicle(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): PermissionResult {
  const effectiveSnapshot = resolveEffectiveSnapshot(snapshot, subscription);
  const inactive = requireActiveSubscription(subscription);
  if (inactive) return inactive;

  return fromPlanValidation(checkVehicleLimit(effectiveSnapshot), 'Vehicle limit reached');
}

export function canAnalyze(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): PermissionResult {
  const effectiveSnapshot = resolveEffectiveSnapshot(snapshot, subscription);
  const inactive = requireActiveSubscription(subscription);
  if (inactive) return inactive;

  return fromPlanValidation(checkAnalysisLimit(effectiveSnapshot), 'Analysis limit reached');
}

export function canViewDetailedDiagnostic(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): PermissionResult {
  const effectiveSnapshot = resolveEffectiveSnapshot(snapshot, subscription);
  const inactive = requireActiveSubscription(subscription);
  if (inactive) return inactive;

  if (!hasPremiumAccess(subscription)) {
    return {
      allowed: false,
      reason: 'Detailed diagnostics require a paid plan',
    };
  }

  return fromPlanValidation(
    checkDetailedDiagnosticLimit(effectiveSnapshot),
    'Detailed diagnostics are not available'
  );
}

export function canExportPdf(subscription: SubscriptionInfo): PermissionResult {
  const inactive = requireActiveSubscription(subscription);
  if (inactive) return inactive;

  if (!hasPremiumAccess(subscription)) {
    return {
      allowed: false,
      reason: 'PDF export requires a Premium or Garage plan',
    };
  }

  return { allowed: true };
}

export function canUseGarageWorkspace(subscription: SubscriptionInfo): PermissionResult {
  const inactive = requireActiveSubscription(subscription);
  if (inactive) return inactive;

  if (!hasGarageAccess(subscription)) {
    return {
      allowed: false,
      reason: 'Garage workspace requires a Garage plan',
    };
  }

  if (!canAccessDetailedDiagnostic(subscription.plan)) {
    return {
      allowed: false,
      reason: 'Garage workspace is not available for this plan',
    };
  }

  return { allowed: true };
}

async function verifyPlanAction(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot,
  local: PermissionResult,
  action: 'add_vehicle' | 'analyze',
  upgradeTo: UserPlan
): Promise<PlanAccessValidation> {
  const effectiveSnapshot = resolveEffectiveSnapshot(snapshot, subscription);

  if (!local.allowed) {
    return {
      allowed: false,
      plan: subscription.plan,
      reason: local.reason,
      upgradeTo,
    };
  }

  if (shouldBypassServerPlanCheck(subscription)) {
    if (__DEV__ && getPlanSyncState(subscription, effectiveSnapshot) === 'revenuecat_ahead') {
      console.log(
        '[SubscriptionEngine] RevenueCat actif, Supabase encore Free — accès client accordé (sync serveur pending)'
      );
    }

    return {
      allowed: true,
      plan: subscription.plan,
    };
  }

  return checkServerPlanLimit(action);
}

/** Vérifie la permission véhicule côté moteur puis via RPC Supabase. */
export async function verifyCanAddVehicle(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): Promise<PlanAccessValidation> {
  const local = canAddVehicle(subscription, snapshot);
  return verifyPlanAction(
    subscription,
    snapshot,
    local,
    'add_vehicle',
    subscription.plan === 'free' ? 'premium' : 'garage'
  );
}

/** Vérifie la permission analyse côté moteur puis via RPC Supabase. */
export async function verifyCanAnalyze(
  subscription: SubscriptionInfo,
  snapshot: PlanAccessSnapshot
): Promise<PlanAccessValidation> {
  const local = canAnalyze(subscription, snapshot);
  return verifyPlanAction(subscription, snapshot, local, 'analyze', 'premium');
}
