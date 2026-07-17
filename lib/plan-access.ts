import { supabase } from './supabase';
import { normalizeUserPlan, type UserPlan } from './diagnostic-engine';

export type PlanAccessSnapshot = {
  plan: UserPlan;
  vehicleCount: number;
  maxVehicles: number;
  monthlyAnalyses: number;
  maxAnalyses: number;
};

export type PlanAccessAction = 'add_vehicle' | 'analyze' | 'detailed_diagnostic';

export type PlanAccessValidation = {
  allowed: boolean;
  plan: UserPlan;
  reason?: string;
  upgradeTo?: UserPlan;
};

const FREE_SNAPSHOT: PlanAccessSnapshot = {
  plan: 'free',
  vehicleCount: 0,
  maxVehicles: 1,
  monthlyAnalyses: 0,
  maxAnalyses: 3,
};

/** Normalise toute valeur serveur ou locale — inconnu/absent => free. */
export function resolveServerPlan(plan: unknown): UserPlan {
  return normalizeUserPlan(plan);
}

export function canAccessDetailedDiagnostic(plan: UserPlan): boolean {
  return plan === 'premium' || plan === 'garage';
}

export function resolveDiagnosticDisplayPlan(serverPlan: UserPlan, loading: boolean): UserPlan {
  if (loading) return 'free';
  if (serverPlan === 'free') return 'free';
  return canAccessDetailedDiagnostic(serverPlan) ? serverPlan : 'free';
}

export type PlanLimitMessages = {
  vehicleLimitReached: string;
  analysisLimitReached: string;
  upgradeToPremium: string;
  upgradeToGarage: string;
};

export function resolvePlanLimitMessage(
  action: 'add_vehicle' | 'analyze',
  upgradeTo: UserPlan | undefined,
  messages: PlanLimitMessages
): string {
  if (action === 'add_vehicle') {
    return upgradeTo === 'garage' ? messages.upgradeToGarage : messages.upgradeToPremium;
  }
  return messages.upgradeToPremium;
}

export function formatPlanLabel(plan: UserPlan): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function validatePlanLimit(
  snapshot: PlanAccessSnapshot,
  action: PlanAccessAction
): PlanAccessValidation {
  const { plan } = snapshot;

  if (action === 'detailed_diagnostic') {
    const allowed = canAccessDetailedDiagnostic(plan);
    return {
      allowed,
      plan,
      reason: allowed ? undefined : 'Detailed diagnostics require a paid plan',
      upgradeTo: allowed ? undefined : 'premium',
    };
  }

  if (action === 'add_vehicle') {
    if (snapshot.maxVehicles === -1) {
      return { allowed: true, plan };
    }
    if (snapshot.vehicleCount >= snapshot.maxVehicles) {
      return {
        allowed: false,
        plan,
        reason: 'Vehicle limit reached',
        upgradeTo: plan === 'free' ? 'premium' : 'garage',
      };
    }
    return { allowed: true, plan };
  }

  if (action === 'analyze') {
    if (snapshot.maxAnalyses === -1) {
      return { allowed: true, plan };
    }
    if (snapshot.monthlyAnalyses >= snapshot.maxAnalyses) {
      return {
        allowed: false,
        plan,
        reason: 'Monthly analysis limit reached',
        upgradeTo: 'premium',
      };
    }
    return { allowed: true, plan };
  }

  return { allowed: false, plan, reason: 'Unknown action' };
}

function parsePlanAccessSnapshot(data: unknown): PlanAccessSnapshot {
  const row = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

  return {
    plan: resolveServerPlan(row.plan),
    vehicleCount: typeof row.vehicle_count === 'number' ? row.vehicle_count : 0,
    maxVehicles: typeof row.max_vehicles === 'number' ? row.max_vehicles : 1,
    monthlyAnalyses: typeof row.monthly_analyses === 'number' ? row.monthly_analyses : 0,
    maxAnalyses: typeof row.max_analyses === 'number' ? row.max_analyses : 3,
  };
}

/** Récupère plan + compteurs depuis Supabase pour l'utilisateur authentifié. */
export async function fetchPlanAccessSnapshot(): Promise<PlanAccessSnapshot> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return FREE_SNAPSHOT;
    }

    const { data, error } = await supabase.rpc('get_user_plan_details', {
      p_user_id: user.id,
    });

    if (error || !data) {
      return FREE_SNAPSHOT;
    }

    return parsePlanAccessSnapshot(data);
  } catch {
    return FREE_SNAPSHOT;
  }
}

/** Plan effectif autorisé — source de vérité serveur, jamais le cache client. */
export async function fetchAuthorizedUserPlan(): Promise<UserPlan> {
  const snapshot = await fetchPlanAccessSnapshot();
  return snapshot.plan;
}

/** Validation serveur via RPC existante (véhicules, analyses). */
export async function checkServerPlanLimit(
  action: 'add_vehicle' | 'analyze'
): Promise<PlanAccessValidation> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { allowed: false, plan: 'free', reason: 'Not authenticated' };
    }

    const { data, error } = await supabase.rpc('check_plan_limits', {
      p_user_id: user.id,
      p_action: action,
    });

    if (error) {
      return { allowed: false, plan: 'free', reason: error.message };
    }

    const row = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

    return {
      allowed: row.allowed === true,
      plan: resolveServerPlan(row.plan),
      reason: typeof row.reason === 'string' ? row.reason : undefined,
      upgradeTo:
        typeof row.upgrade_to === 'string' ? resolveServerPlan(row.upgrade_to) : undefined,
    };
  } catch {
    return { allowed: false, plan: 'free', reason: 'Unexpected error' };
  }
}
