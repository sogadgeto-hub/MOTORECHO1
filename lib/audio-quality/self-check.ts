import { analyseRecording } from './analyseRecording';
import { computeQualityScore, resolveQualityLevel } from './qualityScore';
import { clampScore } from './guards';
import { recordingQualityToDbRow, dbRowToRecordingQuality } from './persist';
import {
  embedRecordingQuality,
  extractRecordingQuality,
  stripRecordingQualityMarker,
  RECORDING_QUALITY_MARKER,
} from './recommendation';
import { buildTechnicalReport, clearBetaLog, logBetaEvent } from '../beta-logger';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function safeObjectEntries(value: unknown): [string, unknown][] {
  if (!isRecord(value)) return [];
  return Object.entries(value);
}

function safeDbRow(value: unknown): ReturnType<typeof recordingQualityToDbRow> {
  if (!isRecord(value)) return {};
  return value as ReturnType<typeof recordingQualityToDbRow>;
}

/** Node CLI only — never auto-run inside Metro / React Native bundles. */
export function shouldRunAudioQualitySelfCheckInNodeCli(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions?.node === 'string' &&
    Array.isArray(process.argv) &&
    process.argv.some((arg) => typeof arg === 'string' && arg.includes('self-check'))
  );
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

  const sampleQuality = analyseRecording({ samples: [], durationMs: 5000, fileSizeBytes: 12000 });
  const row = recordingQualityToDbRow(sampleQuality);
  assert(row.recording_quality_score != null, 'quality score should serialize');
  assert(safeObjectEntries(row).length > 0, 'db row should contain serializable fields');

  const roundTrip = dbRowToRecordingQuality(safeDbRow(row));
  assert(roundTrip !== null, 'db row should deserialize');
  assert(roundTrip!.qualityScore === sampleQuality.qualityScore, 'quality score round-trip mismatch');

  const legacyText = embedRecordingQuality('Check belts', sampleQuality);
  assert(legacyText.includes(RECORDING_QUALITY_MARKER), 'legacy marker should be present');
  const legacyQuality = extractRecordingQuality(legacyText);
  assert(legacyQuality?.qualityScore === sampleQuality.qualityScore, 'legacy extract failed');
  assert(
    stripRecordingQualityMarker(legacyText) === 'Check belts',
    'strip should remove embedded quality'
  );

  clearBetaLog();
  logBetaEvent('analysis', 'Test event', 'TEST');
  const report = buildTechnicalReport({ appVersion: '1.0.0', platform: 'test' });
  assert(typeof report === 'string' && report.length > 0, 'report should be a non-empty string');
  assert(report.includes('MotorEcho Beta Technical Report'), 'report header missing');
  assert(report.includes('analysis'), 'report should include category');
  assert(!report.includes('Bearer '), 'report must not contain tokens');
  assert(!report.includes('@'), 'report must not contain emails in test context');
}

if (shouldRunAudioQualitySelfCheckInNodeCli()) {
  runAudioQualitySelfCheck();
  console.log('audio-quality self-check passed');
}
