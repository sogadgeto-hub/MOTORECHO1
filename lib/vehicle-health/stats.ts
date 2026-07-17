import type { HealthAnalysisInput, VehicleHealthStats } from './types';

const MS_PER_DAY = 86_400_000;

function sortChronological(records: HealthAnalysisInput[]): HealthAnalysisInput[] {
  return [...records].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function computeVehicleHealthStats(
  records: HealthAnalysisInput[],
  now: Date = new Date()
): VehicleHealthStats {
  if (records.length === 0) {
    return {
      totalAnalyses: 0,
      firstAnalysisDate: null,
      lastAnalysisDate: null,
      daysSinceLastAnalysis: null,
      mostFrequentAnomaly: null,
      mostFrequentAnomalyCount: 0,
    };
  }

  const sorted = sortChronological(records);
  const firstAnalysisDate = sorted[0].created_at;
  const lastAnalysisDate = sorted[sorted.length - 1].created_at;

  const lastMs = new Date(lastAnalysisDate).getTime();
  const daysSinceLastAnalysis = Math.floor((now.getTime() - lastMs) / MS_PER_DAY);

  const anomalyCounts = new Map<string, number>();
  for (const record of records) {
    if (record.result === 'normal_engine' || !record.issue_type) continue;
    anomalyCounts.set(record.issue_type, (anomalyCounts.get(record.issue_type) ?? 0) + 1);
  }

  let mostFrequentAnomaly: string | null = null;
  let mostFrequentAnomalyCount = 0;
  for (const [issue, count] of anomalyCounts.entries()) {
    if (count > mostFrequentAnomalyCount) {
      mostFrequentAnomaly = issue;
      mostFrequentAnomalyCount = count;
    }
  }

  return {
    totalAnalyses: records.length,
    firstAnalysisDate,
    lastAnalysisDate,
    daysSinceLastAnalysis,
    mostFrequentAnomaly,
    mostFrequentAnomalyCount,
  };
}

export function shouldShowAnalysisReminder(
  stats: VehicleHealthStats,
  reminderDays = 30
): boolean {
  if (stats.totalAnalyses === 0) return false;
  if (stats.daysSinceLastAnalysis === null) return false;
  return stats.daysSinceLastAnalysis >= reminderDays;
}
