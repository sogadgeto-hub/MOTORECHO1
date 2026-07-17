import { DEFAULT_HEALTH_SCORE_CONFIG } from './health-score';
import type { HealthEvolutionResult, TimelineEntry } from './types';

export function computeHealthEvolution(
  timeline: TimelineEntry[],
  stableThreshold = DEFAULT_HEALTH_SCORE_CONFIG.evolutionStableThreshold
): HealthEvolutionResult {
  if (timeline.length === 0) {
    return {
      evolution: 'unknown',
      delta: 0,
      previousScore: null,
      currentScore: 100,
    };
  }

  const currentScore = timeline[0].score;

  if (timeline.length === 1) {
    return {
      evolution: 'unknown',
      delta: 0,
      previousScore: null,
      currentScore,
    };
  }

  const previousScore = timeline[1].score;
  const delta = currentScore - previousScore;

  let evolution: HealthEvolutionResult['evolution'] = 'stable';
  if (delta >= stableThreshold) {
    evolution = 'improving';
  } else if (delta <= -stableThreshold) {
    evolution = 'declining';
  }

  return {
    evolution,
    delta,
    previousScore,
    currentScore,
  };
}
