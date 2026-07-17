import type { MeterSample, SilenceMetrics } from './types';

export const SILENCE_DB_THRESHOLD = -48;
export const SILENCE_RATIO_THRESHOLD = 0.32;
export const PROLONGED_SILENCE_WINDOW_MS = 1800;

export function detectSilence(samples: MeterSample[]): SilenceMetrics {
  if (samples.length === 0) {
    return { silenceDetected: false, silenceRatio: 0 };
  }

  const silentCount = samples.filter((sample) => sample.db <= SILENCE_DB_THRESHOLD).length;
  const silenceRatio = silentCount / samples.length;

  return {
    silenceDetected: silenceRatio >= SILENCE_RATIO_THRESHOLD,
    silenceRatio,
  };
}

export function detectProlongedSilenceRolling(
  samples: MeterSample[],
  windowMs = PROLONGED_SILENCE_WINDOW_MS
): boolean {
  if (samples.length < 4) return false;

  const latestTimestamp = samples[samples.length - 1].timestampMs;
  const windowSamples = samples.filter(
    (sample) => latestTimestamp - sample.timestampMs <= windowMs
  );

  if (windowSamples.length < 4) return false;

  return windowSamples.every((sample) => sample.db <= SILENCE_DB_THRESHOLD);
}
