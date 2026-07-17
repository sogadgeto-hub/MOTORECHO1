import { resolveHealthLevel } from './health-level';
import { calculateScoreAtAnalysisIndex } from './health-score';
import type { HealthAnalysisInput, HealthScoreConfig, TimelineEntry } from './types';

function sortChronological(records: HealthAnalysisInput[]): HealthAnalysisInput[] {
  return [...records].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

/** Timeline inversée : la plus récente en premier. */
export function buildHealthTimeline(
  records: HealthAnalysisInput[],
  config?: HealthScoreConfig
): TimelineEntry[] {
  if (records.length === 0) return [];

  const sorted = sortChronological(records);

  const entries: TimelineEntry[] = sorted.map((record, index) => {
    const score = calculateScoreAtAnalysisIndex(sorted, index, config);
    return {
      id: record.id,
      createdAt: record.created_at,
      score,
      level: resolveHealthLevel(score),
      result: record.result,
      issue_type: record.issue_type,
      isNormal: record.result === 'normal_engine',
    };
  });

  return entries.reverse();
}
