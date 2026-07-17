import type { MeterSample } from './types';
import { computeVolumeMetrics, dbToNormalized } from './volume';

export function estimateNoiseLevel(samples: MeterSample[]): number {
  if (samples.length < 4) return 0;

  const normalized = samples.map((sample) => dbToNormalized(sample.db));
  const mean = normalized.reduce((acc, value) => acc + value, 0) / normalized.length;
  const variance =
    normalized.reduce((acc, value) => acc + (value - mean) ** 2, 0) / normalized.length;
  const stdDev = Math.sqrt(variance);

  return Math.max(0, Math.min(1, stdDev * 3.2));
}

export function detectHighAmbientNoise(samples: MeterSample[]): boolean {
  const noiseLevel = estimateNoiseLevel(samples);
  const { averageVolume } = computeVolumeMetrics(samples);

  return noiseLevel > 0.32 && averageVolume > 0.2;
}
