import { detectClipping } from './clipping';
import { detectHighAmbientNoise, estimateNoiseLevel } from './noise';
import { detectSilence } from './silence';
import { computeQualityScore, resolveQualityLevel } from './qualityScore';
import { clampScore, sanitizeDurationMs, sanitizeNormalized } from './guards';
import type { AudioAnalysisInput, RecordingQuality } from './types';
import { computeVolumeMetrics, estimateVolumeFromFileSize } from './volume';

export function analyseRecording(input: AudioAnalysisInput): RecordingQuality {
  const durationMs = sanitizeDurationMs(input.durationMs);
  const { samples, fileSizeBytes } = input;

  const volume =
    samples.length > 0
      ? computeVolumeMetrics(samples)
      : estimateVolumeFromFileSize(fileSizeBytes ?? 0, durationMs);

  const { silenceDetected, silenceRatio } = detectSilence(samples);
  const clippingDetected = detectClipping(samples);
  const noiseLevel =
    samples.length > 0
      ? estimateNoiseLevel(samples)
      : Math.max(0, 0.25 - volume.averageVolume * 0.2);

  const qualityScore = computeQualityScore({
    averageVolume: sanitizeNormalized(volume.averageVolume),
    peakVolume: sanitizeNormalized(volume.peakVolume),
    noiseLevel: sanitizeNormalized(noiseLevel),
    clippingDetected,
    silenceDetected,
    silenceRatio: sanitizeNormalized(silenceRatio),
  });

  return {
    recordingDuration: durationMs,
    averageVolume: roundMetric(sanitizeNormalized(volume.averageVolume)),
    peakVolume: roundMetric(sanitizeNormalized(volume.peakVolume)),
    noiseLevel: roundMetric(sanitizeNormalized(noiseLevel)),
    clippingDetected,
    silenceDetected,
    qualityScore: clampScore(qualityScore),
    qualityLevel: resolveQualityLevel(qualityScore),
  };
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Future hook: extend with spectral / idle / wind without UI changes. */
export function analyseRecordingExtended(input: AudioAnalysisInput): RecordingQuality {
  return analyseRecording(input);
}
