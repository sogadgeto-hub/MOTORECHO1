import { clampScore } from './guards';
import type { RecordingQualityLevel } from './types';

export type QualityScoreInput = {
  averageVolume: number;
  peakVolume: number;
  noiseLevel: number;
  clippingDetected: boolean;
  silenceDetected: boolean;
  silenceRatio: number;
};

export function computeQualityScore(input: QualityScoreInput): number {
  let score = 100;

  if (input.silenceDetected) {
    score -= Math.min(42, 20 + input.silenceRatio * 45);
  }

  if (input.clippingDetected) {
    score -= 28;
  }

  if (input.averageVolume < 0.15) {
    score -= 28;
  } else if (input.averageVolume < 0.24) {
    score -= 14;
  }

  if (input.noiseLevel > 0.42) {
    score -= 20;
  } else if (input.noiseLevel > 0.28) {
    score -= 10;
  }

  if (input.peakVolume > 0.94) {
    score -= 8;
  }

  return clampScore(score);
}

export function resolveQualityLevel(score: number): RecordingQualityLevel {
  const safe = clampScore(score);
  if (safe >= 85) return 'excellent';
  if (safe >= 70) return 'good';
  if (safe >= 50) return 'fair';
  return 'poor';
}

export function resolveIndicatorLevel(
  score: number
): 'excellent' | 'good' | 'poor' {
  const safe = clampScore(score);
  if (safe >= 75) return 'excellent';
  if (safe >= 50) return 'good';
  return 'poor';
}
