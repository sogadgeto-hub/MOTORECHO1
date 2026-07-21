import type { RecordingQuality } from './types';
import { clampScore, sanitizeDurationMs, sanitizeNormalized } from './guards';

export type RecordingQualityDbRow = {
  recording_quality_score: number | null;
  recording_quality_level: string | null;
  recording_duration_ms: number | null;
  average_volume: number | null;
  peak_volume: number | null;
  noise_level: number | null;
  clipping_detected: boolean | null;
  silence_detected: boolean | null;
};

export function recordingQualityToDbRow(
  quality: RecordingQuality | null | undefined
): Partial<RecordingQualityDbRow> {
  if (!quality) return {};

  return {
    recording_quality_score: clampScore(quality.qualityScore),
    recording_quality_level: quality.qualityLevel,
    recording_duration_ms: sanitizeDurationMs(quality.recordingDuration),
    average_volume: sanitizeNormalized(quality.averageVolume),
    peak_volume: sanitizeNormalized(quality.peakVolume),
    noise_level: sanitizeNormalized(quality.noiseLevel),
    clipping_detected: quality.clippingDetected,
    silence_detected: quality.silenceDetected,
  };
}

export function dbRowToRecordingQuality(
  row: Partial<RecordingQualityDbRow> | null | undefined
): RecordingQuality | null {
  if (row == null || typeof row !== 'object') {
    return null;
  }

  if (row.recording_quality_score == null && row.recording_quality_level == null) {
    return null;
  }

  return {
    recordingDuration: row.recording_duration_ms ?? 0,
    averageVolume: Number(row.average_volume ?? 0),
    peakVolume: Number(row.peak_volume ?? 0),
    noiseLevel: Number(row.noise_level ?? 0),
    clippingDetected: row.clipping_detected ?? false,
    silenceDetected: row.silence_detected ?? false,
    qualityScore: clampScore(Number(row.recording_quality_score ?? 0)),
    qualityLevel:
      (row.recording_quality_level as RecordingQuality['qualityLevel']) ?? 'fair',
  };
}
