import { detectClipping } from './clipping';
import { detectHighAmbientNoise, estimateNoiseLevel } from './noise';
import { detectSilence } from './silence';
import { computeQualityScore, resolveQualityLevel } from './qualityScore';
import type { AudioAnalysisInput, RecordingQuality } from './types';
import { computeVolumeMetrics, estimateVolumeFromFileSize } from './volume';

export function analyseRecording(input: AudioAnalysisInput): RecordingQuality {
  const { samples, durationMs, fileSizeBytes } = input;

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
    averageVolume: volume.averageVolume,
    peakVolume: volume.peakVolume,
    noiseLevel,
    clippingDetected,
    silenceDetected,
    silenceRatio,
  });

  return {
    recordingDuration: durationMs,
    averageVolume: roundMetric(volume.averageVolume),
    peakVolume: roundMetric(volume.peakVolume),
    noiseLevel: roundMetric(noiseLevel),
    clippingDetected,
    silenceDetected,
    qualityScore,
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
