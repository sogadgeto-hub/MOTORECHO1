import { calculateVehicleHealthScore } from './health-score';
import { buildHealthTimeline } from './timeline';
import { computeVehicleHealthStats, shouldShowAnalysisReminder } from './stats';
import { computeHealthEvolution } from './evolution';
import type { HealthAnalysisInput, HealthScoreConfig, VehicleHealthDashboardData } from './types';

export type {
  HealthAnalysisInput,
  HealthEvolution,
  HealthLevelId,
  HealthScoreConfig,
  ResolvedHealthLevel,
  TimelineEntry,
  VehicleHealthDashboardData,
  VehicleHealthScoreResult,
  VehicleHealthStats,
} from './types';

export {
  DEFAULT_HEALTH_SCORE_CONFIG,
  calculateVehicleHealthScore,
  calculateScoreAtAnalysisIndex,
} from './health-score';
export { resolveHealthLevel, getHealthLevelTitleKey, getHealthLevelDescriptionKey } from './health-level';
export { buildHealthTimeline } from './timeline';
export { computeVehicleHealthStats, shouldShowAnalysisReminder } from './stats';
export { computeHealthEvolution } from './evolution';
export { upsertHealthSnapshot, getHealthSnapshots } from './snapshots';
export { mapDiagnosticToHealthInput, mapDiagnosticsToHealthInputs } from './from-diagnostic';

export function buildVehicleHealthDashboard(
  records: HealthAnalysisInput[],
  options?: { config?: HealthScoreConfig; now?: Date; reminderDays?: number }
): VehicleHealthDashboardData {
  const config = options?.config;
  const now = options?.now ?? new Date();
  const reminderDays = options?.reminderDays ?? 30;

  const score = calculateVehicleHealthScore(records, config);
  const timeline = buildHealthTimeline(records, config);
  const stats = computeVehicleHealthStats(records, now);
  const evolution = computeHealthEvolution(timeline, config?.evolutionStableThreshold);

  return {
    score,
    evolution,
    timeline,
    stats,
    showAnalysisReminder: shouldShowAnalysisReminder(stats, reminderDays),
  };
}
