import type { MeterSample, VolumeMetrics } from './types';

export const MIN_METER_DB = -160;
export const MAX_METER_DB = 0;

export function dbToNormalized(db: number): number {
  const clamped = Math.max(MIN_METER_DB, Math.min(MAX_METER_DB, db));
  return (clamped - MIN_METER_DB) / (MAX_METER_DB - MIN_METER_DB);
}

export function computeVolumeMetrics(samples: MeterSample[]): VolumeMetrics {
  if (samples.length === 0) {
    return { averageVolume: 0, peakVolume: 0 };
  }

  const normalized = samples.map((sample) => dbToNormalized(sample.db));
  const sum = normalized.reduce((acc, value) => acc + value, 0);

  return {
    averageVolume: sum / normalized.length,
    peakVolume: Math.max(...normalized),
  };
}

export function estimateVolumeFromFileSize(sizeBytes: number, durationMs: number): VolumeMetrics {
  if (durationMs <= 0 || sizeBytes <= 0) {
    return { averageVolume: 0.3, peakVolume: 0.4 };
  }

  const bytesPerSecond = sizeBytes / (durationMs / 1000);
  const normalized = Math.max(0, Math.min(1, (bytesPerSecond - 1500) / 12_000));

  return {
    averageVolume: normalized,
    peakVolume: Math.min(1, normalized + 0.15),
  };
}

export function isVolumeTooLow(averageVolume: number): boolean {
  return averageVolume < 0.18;
}
