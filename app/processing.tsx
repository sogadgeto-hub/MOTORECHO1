import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Cpu } from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { Colors, MD3Colors, Spacing, Radii, Animation, IconSize, IconStroke } from '@/lib/theme';
import { resolveAudioUriForProcessing, removePendingAudioSession, getPendingAudioSession } from '@/lib/audio';
import * as FileSystem from 'expo-file-system/legacy';
import { getPrimaryVehicle, processAudioDiagnostic } from '@/lib/analyzer';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { logBetaEvent } from '@/lib/beta-logger';
import { updateBetaSessionSnapshot } from '@/lib/beta-session-snapshot';

export default function ProcessingScreen() {
  const router = useRouter();
  const { audioSessionId, audioUri, durationMs } = useLocalSearchParams<{
    audioSessionId?: string;
    audioUri?: string;
    durationMs?: string;
  }>();
  const { user } = useAuth();
  const { refreshUsage } = useSubscriptionAccess();
  const { t } = useI18n();
  const [textIndex, setTextIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'analyzing' | 'complete'>('analyzing');
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [progressStep, setProgressStep] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const completeFadeAnim = useRef(new Animated.Value(0)).current;
  const analysisRunning = useRef(false);
  const mountedRef = useRef(true);

  const analysisTexts = [
    t.processing.messages['0'],
    t.processing.messages['1'],
    t.processing.messages['2'],
    t.processing.messages['3'],
  ];

  useEffect(() => {
    mountedRef.current = true;
    updateBetaSessionSnapshot({ recordingPhase: 'processing' });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    spin.start();
    pulse.start();

    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % analysisTexts.length);
    }, 2500);

    Animated.timing(fadeAnim, { toValue: 1, duration: Animation.normal, useNativeDriver: true }).start();
    void hapticLight();

    const progressInterval = setInterval(() => {
      setProgressStep((prev) => Math.min(prev + 1, 3));
    }, 2200);

    return () => {
      spin.stop();
      pulse.stop();
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, [analysisTexts.length, fadeAnim, pulseAnim, spinAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressStep / 3,
      duration: Animation.normal,
      useNativeDriver: false,
    }).start();
  }, [progressStep, progressAnim]);

  const navigateToResult = useCallback(
    (
      analysis: Awaited<ReturnType<typeof processAudioDiagnostic>>['analysis'],
      recordId: string | null,
      saveFailed: boolean,
      vehicleId: string | null
    ) => {
      router.replace({
        pathname: '/result',
        params: {
          result: analysis.result,
          type: analysis.type ?? '',
          confidence: String(analysis.confidence),
          severity: analysis.severity,
          recommendation: analysis.recommendation,
          recordId: recordId ?? '',
          isSimulated: analysis.isSimulated ? '1' : '0',
          fromAnalysis: '1',
          saveFailed: saveFailed ? '1' : '0',
          vehicleId: vehicleId ?? '',
        },
      });
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;

    async function runAnalysis() {
      if (analysisRunning.current) return;
      analysisRunning.current = true;

      try {
        if (!user) {
          throw new Error(t.processing.notAuthenticated);
        }

        const resolvedUri = await resolveAudioUriForProcessing(audioSessionId, audioUri ?? null);

        const fileInfo = await FileSystem.getInfoAsync(resolvedUri);
        const fileSize = 'size' in fileInfo && typeof fileInfo.size === 'number' ? fileInfo.size : 0;

        if (!fileInfo.exists || fileSize <= 0) {
          throw new Error(t.processing.missingAudio);
        }

        const session = audioSessionId ? getPendingAudioSession(audioSessionId) : null;
        const parsedDuration = session?.durationMs ?? parseInt(durationMs ?? '0', 10);

        updateBetaSessionSnapshot({
          recordingPhase: 'processing',
          durationMs: parsedDuration,
          qualityScore: session?.recordingQuality?.qualityScore ?? null,
        });

        const vehicle = await getPrimaryVehicle();
        const vehicleInfo = vehicle
          ? {
              brand: vehicle.brand,
              model: vehicle.model,
              year: vehicle.year,
              fuel_type: vehicle.fuel_type,
            }
          : null;

        const outcome = await processAudioDiagnostic(
          resolvedUri,
          parsedDuration,
          user.id,
          vehicle?.id ?? null,
          vehicleInfo,
          session?.recordingQuality ?? null,
          session?.clientRequestId ?? null
        );

        if (cancelled || !mountedRef.current) return;

        if (audioSessionId) {
          removePendingAudioSession(audioSessionId);
        }

        if (outcome.saveFailed) {
          logBetaEvent(
            'supabase_save',
            outcome.saveErrorMessage ?? 'Diagnostic save failed',
            'SAVE_FAILED'
          );
        } else {
          logBetaEvent('analysis', 'Analysis completed and saved', 'ANALYSIS_OK');
        }

        try {
          await refreshUsage('after_analysis');
        } catch (refreshError: unknown) {
          const message =
            refreshError instanceof Error ? refreshError.message : 'Subscription refresh failed';
          logBetaEvent('subscription', message, 'SUBSCRIPTION_REFRESH_FAILED');
        }

        setPhase('complete');
        setProgressStep(3);
        void hapticSuccess();
        Animated.timing(completeFadeAnim, {
          toValue: 1,
          duration: Animation.normal,
          useNativeDriver: true,
        }).start();

        await new Promise((resolve) => setTimeout(resolve, 2500));

        if (cancelled || !mountedRef.current) return;

        updateBetaSessionSnapshot({ recordingPhase: 'complete' });
        navigateToResult(outcome.analysis, outcome.record?.id ?? null, outcome.saveFailed, vehicle?.id ?? null);
      } catch (err: unknown) {
        if (cancelled || !mountedRef.current) return;
        const msg = err instanceof Error ? err.message : t.processing.analysisInterrupted;
        logBetaEvent('analysis', msg, 'ANALYSIS_FAILED');
        setError(msg);
      } finally {
        analysisRunning.current = false;
      }
    }

    void runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [
    audioSessionId,
    audioUri,
    completeFadeAnim,
    durationMs,
    navigateToResult,
    refreshUsage,
    t.processing.analysisInterrupted,
    t.processing.missingAudio,
    t.processing.notAuthenticated,
    user,
  ]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  if (error) {
    return (
      <AppBackground>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{t.processing.failedTitle}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.replace('/recording')}
            activeOpacity={0.85}
          >
            <Text style={styles.retryButtonText}>{t.processing.retryRecording}</Text>
          </TouchableOpacity>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.content}>
          {phase === 'complete' ? (
            <Animated.View style={[styles.completeBlock, { opacity: completeFadeAnim }]}>
              <View style={styles.completeIconCircle}>
                <CheckCircle size={IconSize.xxl} color={MD3Colors.primaryFixedDim} strokeWidth={IconStroke.thin} />
              </View>
              <Text style={styles.title}>{t.processing.completeTitle}</Text>
              <Text style={styles.subtitle}>{t.processing.completeSubtitle}</Text>
            </Animated.View>
          ) : (
            <>
              <View style={styles.ringContainer}>
                <Animated.View style={[styles.ring, { opacity: pulseOpacity }]} />
                <Animated.View
                  style={[styles.ring2, { opacity: pulseOpacity, transform: [{ rotate: spinInterpolate }] }]}
                />
                <View style={styles.iconCircle}>
                  <Cpu size={IconSize.xxl} color={MD3Colors.primaryFixedDim} strokeWidth={IconStroke.thin} />
                </View>
              </View>

              <Text style={styles.title}>{t.processing.title}</Text>
              <Animated.View style={styles.textContainer}>
                <Text style={styles.subtitle}>{analysisTexts[textIndex]}</Text>
              </Animated.View>

              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['8%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>

              <View style={styles.stepsContainer}>
                <View style={styles.stepRow}>
                  <View style={styles.stepDotDone} />
                  <Text style={styles.stepTextDone}>{t.processing.step1}</Text>
                </View>
                <View style={styles.stepLineDone} />
                <View style={styles.stepRow}>
                  <Animated.View style={[styles.stepDotActive, { opacity: pulseOpacity }]} />
                  <Text style={styles.stepTextActive}>{t.processing.step2}</Text>
                </View>
                <View style={styles.stepLinePending} />
                <View style={styles.stepRow}>
                  <View style={styles.stepDotPending} />
                  <Text style={styles.stepTextPending}>{t.processing.step3}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </AppBackground>
  );
}

const RING_SIZE = 160;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  completeBlock: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  completeIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.primaryGlow,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: MD3Colors.primaryFixedDim,
  },
  ring2: {
    position: 'absolute',
    width: RING_SIZE + 24,
    height: RING_SIZE + 24,
    borderRadius: (RING_SIZE + 24) / 2,
    borderWidth: 1,
    borderColor: MD3Colors.primaryFixedDim,
    borderStyle: 'dashed',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.successBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    color: MD3Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  textContainer: {
    height: 24,
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: MD3Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  progressBarTrack: {
    width: '100%',
    maxWidth: 280,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceElevated,
    marginTop: Spacing.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: MD3Colors.primaryFixedDim,
  },
  stepsContainer: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
    paddingVertical: Spacing.sm,
  },
  stepDotDone: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MD3Colors.primaryFixedDim,
  },
  stepDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MD3Colors.primaryFixedDim,
  },
  stepDotPending: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  stepTextDone: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
  },
  stepTextActive: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
  },
  stepTextPending: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textDisabled,
  },
  stepLineDone: {
    width: 1,
    height: 16,
    backgroundColor: MD3Colors.primaryFixedDim,
    marginLeft: 5,
  },
  stepLinePending: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  errorTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: MD3Colors.onSurface,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: MD3Colors.primaryFixedDim,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
  },
});
