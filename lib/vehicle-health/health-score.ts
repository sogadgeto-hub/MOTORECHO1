import { resolveHealthLevel } from './health-level';
import type { HealthAnalysisInput, HealthScoreConfig, VehicleHealthScoreResult } from './types';

/**
 * Configuration V1 — modifiable sans toucher à l'UI.
 * Prévu pour être remplacée / enrichie par un moteur IA ultérieur.
 */
export const DEFAULT_HEALTH_SCORE_CONFIG: HealthScoreConfig = {
  baseScore: 100,
  recentWindowSize: 12,
  resultPenalties: {
    anomaly_detected: 18,
    suspicious_noise: 8,
    normal_engine: 0,
  },
  severityPenalties: {
    critical: 12,
    high: 8,
    medium: 5,
    low: 2,
  },
  perAnomalyCountPenalty: 4,
  confidencePenaltyFactor: 10,
  lowConfidenceThreshold: 0.55,
  lowConfidenceExtraPenalty: 3,
  consecutiveNormalBonus: 2,
  maxConsecutiveNormalBonus: 10,
  evolutionStableThreshold: 3,
};

function sortChronological(records: HealthAnalysisInput[]): HealthAnalysisInput[] {
  return [...records].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

/**
 * Estimation MotorEcho du score de santé (0–100) à partir des analyses d'un véhicule.
 * Ne représente pas une mesure officielle constructeur.
 */
export function calculateVehicleHealthScore(
  records: HealthAnalysisInput[],
  config: HealthScoreConfig = DEFAULT_HEALTH_SCORE_CONFIG
): VehicleHealthScoreResult {
  if (records.length === 0) {
    return {
      score: 100,
      level: resolveHealthLevel(100),
      consecutiveNormalCount: 0,
      anomalyCountRecent: 0,
    };
  }

  const sorted = sortChronological(records);
  const recent = sorted.slice(-config.recentWindowSize);

  let score = config.baseScore;
  let anomalyCountRecent = 0;

  for (const record of recent) {
    const resultPenalty = config.resultPenalties[record.result] ?? 0;
    score -= resultPenalty;

    if (record.result !== 'normal_engine') {
      anomalyCountRecent += 1;
      score -= config.perAnomalyCountPenalty;

      const severityPenalty =
        config.severityPenalties[record.severity] ?? config.severityPenalties.low;
      score -= severityPenalty;

      const confidence = Math.max(0, Math.min(1, record.confidence ?? 0));
      const confidenceGap = Math.max(0, 1 - confidence);
      score -= confidenceGap * config.confidencePenaltyFactor;

      if (confidence < config.lowConfidenceThreshold) {
        score -= config.lowConfidenceExtraPenalty;
      }
    }
  }

  let consecutiveNormalCount = 0;
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    if (sorted[index].result === 'normal_engine') {
      consecutiveNormalCount += 1;
    } else {
      break;
    }
  }

  score += Math.min(
    consecutiveNormalCount * config.consecutiveNormalBonus,
    config.maxConsecutiveNormalBonus
  );

  const finalScore = Math.round(Math.max(0, Math.min(100, score)));

  return {
    score: finalScore,
    level: resolveHealthLevel(finalScore),
    consecutiveNormalCount,
    anomalyCountRecent,
  };
}

/** Score cumulé après chaque analyse (pour la timeline). */
export function calculateScoreAtAnalysisIndex(
  records: HealthAnalysisInput[],
  endIndexInclusive: number,
  config?: HealthScoreConfig
): number {
  const sorted = sortChronological(records);
  const slice = sorted.slice(0, endIndexInclusive + 1);
  return calculateVehicleHealthScore(slice, config).score;
}
