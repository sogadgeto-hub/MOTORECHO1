import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Square, ArrowLeft } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { AppBackground } from '@/components/AppBackground';
import { WaveformAnimation } from '@/components/WaveformAnimation';
import { MD3Colors, Colors, Spacing, Radii } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { UpgradeModal } from '@/components/UpgradeModal';

const MAX_DURATION = 10000;

export default function RecordingScreen() {
  const router = useRouter();
  const { checkLimit, profile } = useAuth();
  const { t } = useI18n();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recording) recording.stopAndUnloadAsync();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      const pulse = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRecording]);

  async function checkAndStart() {
    setError(null);
    const result = await checkLimit('analyze');
    if (!result.allowed) {
      setUpgradeReason(result.reason ?? t.limits.analysisLimitReached);
      setShowUpgradeModal(true);
      return;
    }
    await startRecording();
  }

  async function startRecording() {
    try {
      setError(null);
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError(t.recording.permissionRequired);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 100;
          if (next >= MAX_DURATION) {
            stopRecording(rec);
            return MAX_DURATION;
          }
          return next;
        });
      }, 100);
    } catch {
      setError(t.recording.failedToStart);
    }
  }

  async function stopRecording(rec?: Audio.Recording) {
    const activeRecording = rec ?? recording;
    if (!activeRecording) return;
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();
      setIsRecording(false);
      if (uri) {
        router.replace({ pathname: '/processing', params: { audioUri: uri } });
      } else {
        setError(t.recording.recordingFailed);
      }
    } catch {
      setError(t.recording.processingFailed);
    }
  }

  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    const c = Math.floor((ms % 1000) / 10);
    return `${s}.${String(c).padStart(2, '0')}`;
  }

  const progress = elapsed / MAX_DURATION;

  return (
    <AppBackground>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <ArrowLeft size={24} color={Colors.textSecondary} strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{t.recording.title}</Text>
        <Text style={styles.subtitle}>
          {isRecording ? t.recording.listening : t.recording.subtitle}
        </Text>

        <View style={styles.waveformContainer}>
          <WaveformAnimation active={isRecording} />
        </View>

        <View style={styles.timerContainer}>
          <Text style={[styles.timer, isRecording && styles.timerActive]}>
            {formatTime(elapsed)}
          </Text>
          <Text style={styles.timerLimit}>{t.recording.timerLimit}</Text>
        </View>

        {isRecording && (
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

        <TouchableOpacity
          style={styles.recordButtonOuter}
          onPress={() => (isRecording ? stopRecording() : checkAndStart())}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isRecording ? [Colors.danger, '#C62828'] : [Colors.primary, Colors.primaryDark]}
            style={[styles.recordButtonInner, isRecording && { transform: [{ scale: 1.08 }] }]}
          >
            {isRecording ? (
              <Square size={32} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
            ) : (
              <Mic size={40} color="#FFFFFF" strokeWidth={1.5} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.hint}>
          {isRecording ? t.recording.tapToStop : t.recording.tapToStart}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={profile?.plan_type ?? 'free'}
        upgradeTo="premium"
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
  container: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
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
    marginBottom: Spacing.xl,
  },
  waveformContainer: {
    marginBottom: Spacing.xl,
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
  errorContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.dangerBg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
  },
});
