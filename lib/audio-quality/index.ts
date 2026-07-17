export type {
  AudioAnalysisInput,
  FutureAudioAnalysisExtensions,
  LiveQualityState,
  MeterSample,
  QualityIssueType,
  RecordingQuality,
  RecordingQualityLevel,
  SilenceMetrics,
  VolumeMetrics,
} from './types';

export { analyseRecording, analyseRecordingExtended } from './analyseRecording';
export { detectClipping, detectClippingRolling } from './clipping';
export { detectHighAmbientNoise, estimateNoiseLevel } from './noise';
export {
  analyseLiveQuality,
  embedRecordingQuality,
  extractRecordingQuality,
  RERECORD_SCORE_THRESHOLD,
  RECORDING_QUALITY_MARKER,
  resolveActiveQualityIssue,
  shouldRecommendReRecord,
  stripRecordingQualityMarker,
} from './recommendation';
export {
  computeQualityScore,
  resolveIndicatorLevel,
  resolveQualityLevel,
} from './qualityScore';
export {
  detectProlongedSilenceRolling,
  detectSilence,
  PROLONGED_SILENCE_WINDOW_MS,
  SILENCE_DB_THRESHOLD,
} from './silence';
export {
  computeVolumeMetrics,
  dbToNormalized,
  estimateVolumeFromFileSize,
  isVolumeTooLow,
  MAX_METER_DB,
  MIN_METER_DB,
} from './volume';
