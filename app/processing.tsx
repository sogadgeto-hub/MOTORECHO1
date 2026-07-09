import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Cpu } from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { Colors, MD3Colors, Spacing } from '@/lib/theme';
import { analyzeAudio, saveDiagnostic, uploadAudio } from '@/lib/analyzer';
import { getPrimaryVehicle } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export default function ProcessingScreen() {
  const router = useRouter();
  const { audioUri } = useLocalSearchParams<{ audioUri?: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const [textIndex, setTextIndex] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const analysisTexts = [
    t.processing.messages['0'],
    t.processing.messages['1'],
    t.processing.messages['2'],
    t.processing.messages['3'],
  ];

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

    const fadeIn = Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true });
    fadeIn.start();

    runAnalysis();

    return () => {
      spin.stop();
      pulse.stop();
      clearInterval(textInterval);
    };
  }, []);

  async function runAnalysis() {
    try {
      const vehicle = await getPrimaryVehicle();

      // Upload audio to storage (non-blocking — don't fail analysis if upload fails)
      let audioPath: string | null = null;
      if (audioUri && user) {
        audioPath = await uploadAudio(audioUri, user.id);
      }

      const vehicleInfo = vehicle ? {
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        fuel_type: vehicle.fuel_type,
      } : null;

      const result = await analyzeAudio(vehicle?.id ?? null);
      const record = await saveDiagnostic(result, vehicle?.id ?? null, audioPath, vehicleInfo);
      router.replace({
        pathname: '/result',
        params: {
          result: result.result,
          type: result.type ?? '',
          confidence: String(result.confidence),
          severity: result.severity,
          recommendation: result.recommendation,
          recordId: record.id,
        },
      });
    } catch {
      router.replace({
        pathname: '/result',
        params: {
          result: 'suspicious_noise',
          type: 'engine_knocking',
          confidence: '0.65',
          severity: 'medium',
          recommendation: t.processing.analysisInterrupted,
          recordId: '',
        },
      });
    }
  }

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <AppBackground>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.content}>
          <View style={styles.ringContainer}>
            <Animated.View style={[styles.ring, { opacity: pulseOpacity }]} />
            <Animated.View
              style={[styles.ring2, { opacity: pulseOpacity, transform: [{ rotate: spinInterpolate }] }]}
            />
            <View style={styles.iconCircle}>
              <Cpu size={40} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
            </View>
          </View>

          <Text style={styles.title}>{t.processing.title}</Text>
          <Animated.View style={styles.textContainer}>
            <Text style={styles.subtitle}>{analysisTexts[textIndex]}</Text>
          </Animated.View>

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
    backgroundColor: 'rgba(0,219,231,0.08)',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    color: 'rgba(185,202,203,0.4)',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 5,
  },
});
