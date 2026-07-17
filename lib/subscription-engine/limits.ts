import {
  validatePlanLimit,
  type PlanAccessSnapshot,
  type PlanAccessValidation,
} from '@/lib/plan-access';

export type { PlanAccessSnapshot, PlanAccessValidation };

export function checkVehicleLimit(snapshot: PlanAccessSnapshot): PlanAccessValidation {
  return validatePlanLimit(snapshot, 'add_vehicle');
}

export function checkAnalysisLimit(snapshot: PlanAccessSnapshot): PlanAccessValidation {
  return validatePlanLimit(snapshot, 'analyze');
}

export function checkDetailedDiagnosticLimit(snapshot: PlanAccessSnapshot): PlanAccessValidation {
  return validatePlanLimit(snapshot, 'detailed_diagnostic');
}
