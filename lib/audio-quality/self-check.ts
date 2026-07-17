import { analyseRecording } from './analyseRecording';
import { computeQualityScore, resolveQualityLevel } from './qualityScore';
import { clampScore } from './guards';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runAudioQualitySelfCheck(): void {
  const excellent = computeQualityScore({
    averageVolume: 0.5,
    peakVolume: 0.7,
    noiseLevel: 0.1,
    clippingDetected: false,
    silenceDetected: false,
    silenceRatio: 0,
  });
  assert(excellent >= 85, `expected excellent score, got ${excellent}`);
  assert(resolveQualityLevel(excellent) === 'excellent', 'expected excellent level');

  const silent = computeQualityScore({
    averageVolume: 0.05,
    peakVolume: 0.08,
    noiseLevel: 0.05,
    clippingDetected: false,
    silenceDetected: true,
    silenceRatio: 0.8,
  });
  assert(silent < 60, `expected low score for silence, got ${silent}`);

  const clipped = computeQualityScore({
    averageVolume: 0.8,
    peakVolume: 0.99,
    noiseLevel: 0.2,
    clippingDetected: true,
    silenceDetected: false,
    silenceRatio: 0,
  });
  assert(clipped < 80, `expected penalty for clipping, got ${clipped}`);

  const empty = analyseRecording({ samples: [], durationMs: 0, fileSizeBytes: 0 });
  assert(Number.isFinite(empty.qualityScore), 'quality score must be finite');
  assert(empty.qualityScore >= 0 && empty.qualityScore <= 100, 'quality score out of range');
  assert(!Number.isNaN(empty.averageVolume), 'averageVolume must not be NaN');

  assert(clampScore(Number.NaN) === 0, 'NaN should clamp to 0');
  assert(clampScore(Infinity) === 0, 'Infinity should clamp to 0');
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('self-check')) {
  runAudioQualitySelfCheck();
  console.log('audio-quality self-check passed');
}
