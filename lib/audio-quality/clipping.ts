import type { MeterSample } from './types';

export const CLIPPING_DB_THRESHOLD = -3;
export const CLIPPING_RATIO_THRESHOLD = 0.06;

export function detectClipping(samples: MeterSample[]): boolean {
  if (samples.length === 0) return false;

  const clippedCount = samples.filter((sample) => sample.db >= CLIPPING_DB_THRESHOLD).length;
  return clippedCount / samples.length >= CLIPPING_RATIO_THRESHOLD;
}

export function detectClippingRolling(samples: MeterSample[], windowSize = 10): boolean {
  if (samples.length === 0) return false;

  const recent = samples.slice(-windowSize);
  return recent.some((sample) => sample.db >= CLIPPING_DB_THRESHOLD);
}
