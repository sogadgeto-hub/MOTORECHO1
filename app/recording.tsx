import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
  ScrollView,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Square, ArrowLeft, Play, RotateCcw, Check } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { AppBackground } from '@/components/AppBackground';
import { WaveformAnimation } from '@/components/WaveformAnimation';
import { RecordingGuide } from '@/components/RecordingGuide';
import { RecordingQualityIndicator } from '@/components/RecordingQualityIndicator';
import { RecordingQualityBar } from '@/components/RecordingQualityBar';
import { RecordingSummary } from '@/components/RecordingSummary';
import { RecordingAdvice } from '@/components/RecordingAdvice';
import { SkeletonCard } from '@/components/Skeleton';
import { hapticLight } from '@/lib/haptics';
import { Colors, IconStroke, MD3Colors, Palette, Radii, Spacing } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { resolvePlanLimitMessage } from '@/lib/plan-access';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { UpgradeModal } from '@/components/UpgradeModal';
import { MAX_RECORDING_DURATION_MS, createPendingAudioSession, persistRecordedAudio } from '@/lib/audio';
import { getPrimaryVehicle } from '@/lib/db';
import { runRecordingPreflight, type RecordingPreflightResult } from '@/lib/recording-preflight';
import { getMicPermissionStatus, openAppSettings, requestMicPermission } from '@/lib/recording-permissions';
import {
  analyseLiveQuality,
  analyseRecording,
  shouldRecommendReRecord,
  type LiveQualityState,
  type MeterSample,
  type RecordingQuality,
} from '@/lib/audio-quality';
import { logBetaEvent } from '@/lib/beta-logger';
import { updateBetaSessionSnapshot } from '@/lib/beta-session-snapshot';

type RecordingPhase = 'guide' | 'preflight' | 'idle' | 'recording' | 'preview';

const METERING_OPTIONS = {
  ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  android: {
    ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
  },
  ios: {
    ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
    extension: '.m4a',
    isMeteringEnabled: true,
  },
};

const DEFAULT_LIVE_QUALITY: LiveQualityState = {
  score: 70,
  level: 'good',
  indicatorLevel: 'good',
  activeIssue: null,
};

export default function RecordingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plan, verifyAnalyze, refreshUsage } = useSubscriptionAccess(user?.id);
  const { t } = useI18n();
  const [phase, setPhase] = useState<RecordingPhase>('guide');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewDurationMs, setPreviewDurationMs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [upgradeTarget, setUpgradeTarget] = useState<'premium' | 'garage'>('premium');
  const [preflight, setPreflight] = useState<RecordingPreflightResult | null>(null);
  const [liveQuality, setLiveQuality] = useState<LiveQualityState>(DEFAULT_LIVE_QUALITY);
  const [recordingQuality, setRecordingQuality] = useState<RecordingQuality | null>(null);
  const [micBlocked, setMicBlocked] = useState(false);
  const [vehicleMissing, setVehicleMissing] = useState<boolean | null>(null);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meteringRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const busyRef = useRef(false);
  const meterSamplesRef = useRef<MeterSample[]>([]);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupMetering = useCallback(() => {
    if (meteringRef.current) {
      clearInterval(meteringRef.current);
      meteringRef.current = null;
    }
  }, []);

  const unloadPreviewSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // ignore
      }
      soundRef.current = null;
    }
    setIsPlayingPreview(false);
  }, []);

  const resetRecordingState = useCallback(async () => {
    cleanupTimer();
    cleanupMetering();
    await unloadPreviewSound();
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // ignore
      }
    }
    recordingRef.current = null;
    meterSamplesRef.current = [];
    setPreviewUri(null);
    setPreviewDurationMs(0);
    setElapsed(0);
    setLiveQuality(DEFAULT_LIVE_QUALITY);
    setRecordingQuality(null);
    setPhase('idle');
    setIsBusy(false);
    busyRef.current = false;
  }, [cleanupMetering, cleanupTimer, unloadPreviewSound]);

  useEffect(() => {
    return () => {
      cleanupTimer();
      cleanupMetering();
      unloadPreviewSound();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [cleanupMetering, cleanupTimer, unloadPreviewSound]);

  useEffect(() => {
    if (phase === 'recording') {
      const pulse = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    return undefined;
  }, [phase, pulseAnim]);

  const abortRecordingDueToInterruption = useCallback(async () => {
    cleanupTimer();
    cleanupMetering();
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // ignore
      }
      recordingRef.current = null;
    }
    meterSamplesRef.current = [];
    busyRef.current = false;
    setIsBusy(false);
    setElapsed(0);
    setPhase('idle');
    setError(t.recording.interrupted);
    logBetaEvent('audio_interruption', 'Recording stopped due to app backgrounding', 'INTERRUPTED');
    updateBetaSessionSnapshot({ recordingPhase: 'idle' });
  }, [cleanupMetering, cleanupTimer, t.recording.interrupted]);

  useFocusEffect(
    useCallback(() => {
      refreshUsage('after_analysis');
      getPrimaryVehicle()
        .then((vehicle) => setVehicleMissing(!vehicle))
        .catch(() => setVehicleMissing(true));

      void getMicPermissionStatus().then((status) => {
        setMicBlocked(status === 'blocked');
      });
    }, [refreshUsage])
  );

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        if (phase === 'recording' && recordingRef.current) {
          void abortRecordingDueToInterruption();
        }
      }
      if (nextState === 'active') {
        void getMicPermissionStatus().then((status) => setMicBlocked(status === 'blocked'));
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [phase, abortRecordingDueToInterruption]);

  async function handleGuideComplete() {
    setPhase('preflight');
    setError(null);

    try {
      const result = await runRecordingPreflight();
      setPreflight(result);

      if (!result.micGranted) {
        setMicBlocked(result.micBlocked);
        setError(result.micBlocked ? t.recording.permissionBlockedBody : t.recording.permissionRequired);
        logBetaEvent(
          'microphone_permission',
          result.micBlocked ? 'Microphone permission blocked' : 'Microphone permission denied',
          result.micBlocked ? 'MIC_BLOCKED' : 'MIC_DENIED'
        );
        setPhase('guide');
        return;
      }

      setMicBlocked(false);

      setPhase('idle');
    } catch {
      setError(t.recording.failedToStart);
      setPhase('guide');
    }
  }

  async function ensureMicrophonePermission(): Promise<boolean> {
    const status = await getMicPermissionStatus();
    if (status === 'granted') {
      setMicBlocked(false);
      return true;
    }

    const requested = await requestMicPermission();
    if (requested === 'granted') {
      setMicBlocked(false);
      return true;
    }

    setMicBlocked(requested === 'blocked');
    if (requested === 'blocked') {
      setError(t.recording.permissionBlockedBody);
      logBetaEvent('microphone_permission', 'Microphone permission blocked', 'MIC_BLOCKED');
    } else {
      setError(t.recording.permissionRequired);
      logBetaEvent('microphone_permission', 'Microphone permission denied', 'MIC_DENIED');
    }
    return false;
  }

  async function checkAndStart() {
    if (busyRef.current || phase === 'recording') return;

    setError(null);
    const result = await verifyAnalyze();
    if (!result.allowed) {
      setUpgradeTarget(result.upgradeTo === 'garage' ? 'garage' : 'premium');
      setUpgradeReason(resolvePlanLimitMessage('analyze', result.upgradeTo, t.limits));
      setShowUpgradeModal(true);
      return;
    }
    await startRecording();
  }

  function startMeteringPoll(recording: Audio.Recording) {
    cleanupMetering();
    meterSamplesRef.current = [];

    meteringRef.current = setInterval(async () => {
      try {
        const status = await recording.getStatusAsync();
        if (!status.isRecording) return;

        const timestampMs = status.durationMillis ?? elapsed;
        const db =
          typeof status.metering === 'number'
            ? status.metering
            : estimateMeterFromElapsed(timestampMs);

        meterSamplesRef.current.push({ timestampMs, db });
        setLiveQuality(analyseLiveQuality(meterSamplesRef.current));
      } catch {
        // ignore metering errors
      }
    }, 100);
  }

  function estimateMeterFromElapsed(durationMs: number): number {
    const wave = Math.sin(durationMs / 180) * 8;
    return -38 + wave;
  }

  async function startRecording() {
    if (busyRef.current || phase === 'recording') return;

    try {
      busyRef.current = true;
      setIsBusy(true);
      setError(null);
      await unloadPreviewSound();
      setPreviewUri(null);
      setPreviewDurationMs(0);
      setRecordingQuality(null);
      setLiveQuality(DEFAULT_LIVE_QUALITY);

      const allowed = await ensureMicrophonePermission();
      if (!allowed) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording: rec } = await Audio.Recording.createAsync(METERING_OPTIONS);

      recordingRef.current = rec;
      setPhase('recording');
      updateBetaSessionSnapshot({ recordingPhase: 'recording', durationMs: 0, qualityScore: null });
      setElapsed(0);
      startMeteringPoll(rec);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 100;
          if (next >= MAX_RECORDING_DURATION_MS) {
            stopRecording(rec, MAX_RECORDING_DURATION_MS);
            return MAX_RECORDING_DURATION_MS;
          }
          return next;
        });
      }, 100);

      busyRef.current = false;
      setIsBusy(false);
      logBetaEvent('recording_start', 'Recording started', 'REC_START');
    } catch {
      setError(t.recording.failedToStart);
      logBetaEvent('recording_start', 'Failed to start recording', 'REC_START_FAILED');
      await resetRecordingState();
    }
  }

  async function stopRecording(rec?: Audio.Recording, finalDurationMs?: number) {
    const activeRecording = rec ?? recordingRef.current;
    if (!activeRecording) return;

    try {
      busyRef.current = true;
      setIsBusy(true);
      cleanupTimer();
      cleanupMetering();

      const status = await activeRecording.getStatusAsync();
      await activeRecording.stopAndUnloadAsync();

      const uri = activeRecording.getURI();
      const durationMs = finalDurationMs ?? (status.isRecording ? status.durationMillis : elapsed);

      recordingRef.current = null;

      if (!uri) {
        setError(t.recording.recordingFailed);
        setPhase('idle');
        return;
      }

      if (!user) {
        setError(t.recording.notAuthenticated);
        setPhase('idle');
        return;
      }

      const vehicle = await getPrimaryVehicle();
      const persisted = await persistRecordedAudio(uri, user.id, vehicle?.id ?? null);

      const quality = analyseRecording({
        samples: meterSamplesRef.current,
        durationMs: Math.min(durationMs, MAX_RECORDING_DURATION_MS),
        fileSizeBytes: persisted.size,
      });

      setRecordingQuality(quality);
      updateBetaSessionSnapshot({
        recordingPhase: 'preview',
        durationMs: Math.min(durationMs, MAX_RECORDING_DURATION_MS),
        qualityScore: quality.qualityScore,
      });
      setLiveQuality(analyseLiveQuality(meterSamplesRef.current));
      setPreviewUri(persisted.uri);
      setPreviewDurationMs(Math.min(durationMs, MAX_RECORDING_DURATION_MS));
      setElapsed(Math.min(durationMs, MAX_RECORDING_DURATION_MS));
      setPhase('preview');
      logBetaEvent('recording_stop', 'Recording stopped and preview ready', 'REC_STOP');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.recording.processingFailed;
      setError(msg);
      logBetaEvent('recording_stop', msg, 'REC_STOP_FAILED');
      setPhase('idle');
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }

  async function playPreview() {
    if (!previewUri || isBusy) return;

    try {
      setIsBusy(true);
      await unloadPreviewSound();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: previewUri });
      soundRef.current = sound;
      setIsPlayingPreview(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setIsPlayingPreview(false);
        }
      });

      await sound.playAsync();
    } catch {
      setError(t.recording.previewFailed);
      setIsPlayingPreview(false);
    } finally {
      setIsBusy(false);
    }
  }

  async function cancelPreview() {
    if (isBusy) return;
    await resetRecordingState();
    setError(null);
  }

  async function confirmPreview() {
    if (!previewUri || isBusy || !user) return;

    void hapticLight();

    const vehicle = await getPrimaryVehicle();
    const sessionId = createPendingAudioSession({
      uri: previewUri,
      durationMs: previewDurationMs,
      userId: user.id,
      vehicleId: vehicle?.id ?? null,
      recordingQuality,
    });

    router.replace({
      pathname: '/processing',
      params: {
        audioSessionId: sessionId,
      },
    });
  }

  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    const c = Math.floor((ms % 1000) / 10);
    return `${s}.${String(c).padStart(2, '0')}`;
  }

  const isRecording = phase === 'recording';
  const isPreview = phase === 'preview';
  const isGuide = phase === 'guide';
  const isPreflight = phase === 'preflight';
  const progress = elapsed / MAX_RECORDING_DURATION_MS;
  const showRerecordRecommendation =
    recordingQuality !== null && shouldRecommendReRecord(recordingQuality);

  if (vehicleMissing === true) {
    return (
      <AppBackground>
        <View style={styles.blockedContainer}>
          <Text style={styles.blockedTitle}>{t.recording.noVehicle}</Text>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push('/add-vehicle')}
            accessibilityRole="button"
            accessibilityLabel={t.recording.addVehicle}
          >
            <Text style={styles.primaryActionText}>{t.recording.addVehicle}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.recording.goBack}
          >
            <Text style={styles.secondaryActionBtnText}>{t.recording.goBack}</Text>
          </TouchableOpacity>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
        disabled={isBusy && isRecording}
      >
        <ArrowLeft size={24} color={Colors.textSecondary} strokeWidth={2} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {isGuide ? (
            <>
              <RecordingGuide onComplete={handleGuideComplete} />
              {micBlocked && (
                <View style={styles.permissionCard}>
                  <Text style={styles.permissionTitle}>{t.recording.permissionBlockedTitle}</Text>
                  <Text style={styles.permissionBody}>{t.recording.permissionBlockedBody}</Text>
                  <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={() => void openAppSettings()}
                    accessibilityRole="button"
                    accessibilityLabel={t.recording.openSettings}
                  >
                    <Text style={styles.primaryActionText}>{t.recording.openSettings}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.title}>{t.recording.title}</Text>
              <Text style={styles.subtitle}>
                {isPreflight
                  ? t.recordingGuide.preflightSubtitle
                  : isRecording
                    ? t.recording.listening
                    : isPreview
                      ? t.recording.previewSubtitle
                      : t.recording.subtitle}
              </Text>

              {isPreflight && (
                <View style={styles.preflightLoading}>
                  <SkeletonCard lines={2} />
                  <Text style={styles.preflightText}>{t.recordingGuide.preflightTitle}</Text>
                </View>
              )}

              {!isPreflight && (
                <>
                  {(preflight?.batteryLow || preflight?.bluetoothConnected) && phase === 'idle' && (
                    <RecordingAdvice
                      showBatteryWarning={preflight.batteryLow}
                      showBluetoothWarning={preflight.bluetoothConnected}
                    />
                  )}

                  <View style={styles.waveformContainer}>
                    <WaveformAnimation active={isRecording || isPlayingPreview} />
                  </View>

                  {isRecording && (
                    <View style={styles.qualityStack}>
                      <RecordingQualityIndicator liveQuality={liveQuality} />
                      <RecordingQualityBar score={liveQuality.score} />
                      <RecordingAdvice issue={liveQuality.activeIssue} />
                    </View>
                  )}

                  {isPreview && recordingQuality && (
                    <View style={styles.qualityStack}>
                      <RecordingSummary quality={recordingQuality} />
                      <RecordingAdvice showRerecordRecommendation={showRerecordRecommendation} />
                    </View>
                  )}

                  <View style={styles.timerContainer}>
                    <Text style={[styles.timer, (isRecording || isPreview) && styles.timerActive]}>
                      {formatTime(elapsed)}
                    </Text>
                    <Text style={styles.timerLimit}>{t.recording.timerLimit}</Text>
                  </View>

                  {(isRecording || isPreview) && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { flex: progress }]} />
                      </View>
                    </View>
                  )}

                  {isRecording && (
                    <RNAnimated.View style={[styles.recIndicator, { transform: [{ scale: pulseAnim }] }]}>
                      <View style={styles.recDot} />
                      <Text style={styles.recLabel}>{t.recording.rec}</Text>
                    </RNAnimated.View>
                  )}

                  {isPreview ? (
                    <View style={styles.previewActions}>
                      <TouchableOpacity
                        style={styles.secondaryAction}
                        onPress={playPreview}
                        disabled={isBusy}
                        activeOpacity={0.8}
                      >
                        <Play size={20} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
                        <Text style={styles.secondaryActionText}>
                          {isPlayingPreview ? t.recording.playingPreview : t.recording.playPreview}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.previewRow}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={cancelPreview}
                          disabled={isBusy}
                          activeOpacity={0.8}
                        >
                          <RotateCcw size={18} color={Colors.textSecondary} strokeWidth={2} />
                          <Text style={styles.cancelButtonText}>{t.recording.restartRecording}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={confirmPreview}
                          disabled={isBusy}
                          activeOpacity={0.85}
                        >
                          <LinearGradient
                            colors={[Colors.primary, Colors.primaryDark]}
                            style={styles.confirmButtonInner}
                          >
                            <Check size={20} color={Palette.onPrimary} strokeWidth={IconStroke.bold} />
                            <Text style={styles.confirmButtonText}>{t.recording.confirmAnalyze}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    !isPreflight && (
                      <>
                        <TouchableOpacity
                          style={styles.recordButtonOuter}
                          onPress={() => (isRecording ? stopRecording() : checkAndStart())}
                          activeOpacity={0.8}
                          disabled={isBusy && !isRecording}
                        >
                          <LinearGradient
                            colors={
                              isRecording ? [Colors.danger, Colors.dangerDark] : [Colors.primary, Colors.primaryDark]
                            }
                            style={[styles.recordButtonInner, isRecording && { transform: [{ scale: 1.08 }] }]}
                          >
                            {isRecording ? (
                              <Square size={32} color={Palette.onPrimary} fill={Palette.onPrimary} strokeWidth={0} />
                            ) : (
                              <Mic size={40} color={Palette.onPrimary} strokeWidth={IconStroke.thin} />
                            )}
                          </LinearGradient>
                        </TouchableOpacity>

                        <Text style={styles.hint}>
                          {isRecording ? t.recording.tapToStop : t.recording.tapToStart}
                        </Text>
                      </>
                    )
                  )}
                </>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={plan}
        upgradeTo={upgradeTarget}
        reason={upgradeReason}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          router.push('/premium');
        }}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 100,
    paddingBottom: Spacing.xxl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  preflightLoading: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxl,
  },
  preflightText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  qualityStack: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  waveformContainer: {
    marginBottom: Spacing.lg,
    width: '100%',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  timer: {
    fontFamily: 'Inter-Bold',
    fontSize: 56,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  timerActive: {
    color: Colors.primary,
  },
  timerLimit: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: Colors.textMuted,
  },
  progressContainer: {
    width: '80%',
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  recIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.recording,
  },
  recLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.recording,
    letterSpacing: 2,
  },
  recordButtonOuter: {
    marginBottom: Spacing.md,
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  previewActions: {
    width: '100%',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  previewRow: {
    width: '100%',
    gap: Spacing.md,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  secondaryActionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  confirmButton: {
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  confirmButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  confirmButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Palette.onPrimary,
  },
  errorContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.dangerBg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    width: '100%',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
  },
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  blockedTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  permissionCard: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: Radii.md,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.danger,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  permissionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  permissionBody: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Palette.onPrimary,
  },
  secondaryActionBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
