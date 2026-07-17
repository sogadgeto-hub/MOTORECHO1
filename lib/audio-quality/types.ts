export type RecordingQualityLevel = 'excellent' | 'good' | 'fair' | 'poor';

export type QualityIssueType = 'silence' | 'clipping' | 'too_quiet' | 'high_noise';

export type MeterSample = {
  timestampMs: number;
  db: number;
};

export type RecordingQuality = {
  recordingDuration: number;
  averageVolume: number;
  peakVolume: number;
  noiseLevel: number;
  clippingDetected: boolean;
  silenceDetected: boolean;
  qualityScore: number;
  qualityLevel: RecordingQualityLevel;
};

export type AudioAnalysisInput = {
  samples: MeterSample[];
  durationMs: number;
  fileSizeBytes?: number;
};

export type VolumeMetrics = {
  averageVolume: number;
  peakVolume: number;
};

export type SilenceMetrics = {
  silenceDetected: boolean;
  silenceRatio: number;
};

export type LiveQualityState = {
  score: number;
  level: RecordingQualityLevel;
  indicatorLevel: 'excellent' | 'good' | 'poor';
  activeIssue: QualityIssueType | null;
};

/** Reserved for future spectral / idle / acceleration / wind analysis. */
export type FutureAudioAnalysisExtensions = {
  spectralProfile?: Record<string, number>;
  idleDetected?: boolean;
  accelerationDetected?: boolean;
  windDetected?: boolean;
};
