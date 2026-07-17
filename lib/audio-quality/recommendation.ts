import { detectClippingRolling } from './clipping';
import { detectHighAmbientNoise } from './noise';
import { detectProlongedSilenceRolling } from './silence';
import { computeQualityScore, resolveIndicatorLevel, resolveQualityLevel } from './qualityScore';
import type { LiveQualityState, MeterSample, QualityIssueType, RecordingQuality } from './types';
import { computeVolumeMetrics, isVolumeTooLow } from './volume';

export const RERECORD_SCORE_THRESHOLD = 60;

export const RECORDING_QUALITY_MARKER = '<!-- ME_RECORDING_QUALITY -->';

export function resolveActiveQualityIssue(samples: MeterSample[]): QualityIssueType | null {
  if (detectProlongedSilenceRolling(samples)) return 'silence';
  if (detectClippingRolling(samples)) return 'clipping';

  const { averageVolume } = computeVolumeMetrics(samples);
  if (isVolumeTooLow(averageVolume)) return 'too_quiet';
  if (detectHighAmbientNoise(samples)) return 'high_noise';

  return null;
}

export function analyseLiveQuality(samples: MeterSample[]): LiveQualityState {
  const { averageVolume, peakVolume } = computeVolumeMetrics(samples);
  const silenceRatio =
    samples.length === 0
      ? 0
      : samples.filter((sample) => sample.db <= -48).length / samples.length;

  const score = computeQualityScore({
    averageVolume,
    peakVolume,
    noiseLevel: samples.length > 0 ? estimateRollingNoise(samples) : 0.2,
    clippingDetected: detectClippingRolling(samples),
    silenceDetected: silenceRatio >= 0.32,
    silenceRatio,
  });

  const level = resolveQualityLevel(score);

  return {
    score,
    level,
    indicatorLevel: resolveIndicatorLevel(score),
    activeIssue: resolveActiveQualityIssue(samples),
  };
}

function estimateRollingNoise(samples: MeterSample[]): number {
  const recent = samples.slice(-20);
  if (recent.length < 4) return 0;

  const values = recent.map((sample) => {
    const normalized = (sample.db + 160) / 160;
    return Math.max(0, Math.min(1, normalized));
  });

  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance =
    values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;

  return Math.max(0, Math.min(1, Math.sqrt(variance) * 3.2));
}

export function shouldRecommendReRecord(quality: RecordingQuality): boolean {
  return quality.qualityScore < RERECORD_SCORE_THRESHOLD;
}

export function embedRecordingQuality(
  recommendation: string,
  quality: RecordingQuality
): string {
  const clean = stripRecordingQualityMarker(recommendation);
  return `${clean}\n\n${RECORDING_QUALITY_MARKER}${JSON.stringify(quality)}`;
}

export function extractRecordingQuality(recommendation: string | null | undefined): RecordingQuality | null {
  if (!recommendation) return null;

  const markerIndex = recommendation.indexOf(RECORDING_QUALITY_MARKER);
  if (markerIndex < 0) return null;

  const payload = recommendation.slice(markerIndex + RECORDING_QUALITY_MARKER.length).trim();

  try {
    return JSON.parse(payload) as RecordingQuality;
  } catch {
    return null;
  }
}

export function stripRecordingQualityMarker(recommendation: string | null | undefined): string {
  if (!recommendation) return '';

  const markerIndex = recommendation.indexOf(RECORDING_QUALITY_MARKER);
  if (markerIndex < 0) return recommendation;

  return recommendation.slice(0, markerIndex).trimEnd();
}
