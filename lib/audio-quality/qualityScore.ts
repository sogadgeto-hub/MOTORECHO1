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

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function resolveQualityLevel(score: number): RecordingQualityLevel {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

export function resolveIndicatorLevel(
  score: number
): 'excellent' | 'good' | 'poor' {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'good';
  return 'poor';
}
