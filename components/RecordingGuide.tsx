import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import {
  Car,
  ChevronRight,
  MicOff,
  Radio,
  Smartphone,
  Volume2,
  Wrench,
} from 'lucide-react-native';
import { FadeInView } from '@/components/FadeInView';
import { GlassCard } from '@/components/GlassCard';
import { Colors, MD3Colors, Spacing, Radii } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

const STEP_COUNT = 6;

type RecordingGuideProps = {
  onComplete: () => void;
};

export function RecordingGuide({ onComplete }: RecordingGuideProps) {
  const { t } = useI18n();
  const copy = t.recordingGuide;
  const [step, setStep] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (step !== 2) return undefined;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [step, pulseAnim]);

  const steps = [
    { icon: Car, title: copy.steps.startEngine, subtitle: null as string | null },
    { icon: Wrench, title: copy.steps.openHood, subtitle: copy.steps.openHoodHint },
    { icon: Smartphone, title: copy.steps.phoneDistance, subtitle: null as string | null, animated: true },
    { icon: MicOff, title: copy.steps.noSpeaking, subtitle: null as string | null },
    { icon: Radio, title: copy.steps.quietEnvironment, subtitle: null as string | null },
    { icon: Volume2, title: copy.steps.readyToRecord, subtitle: null as string | null },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step >= STEP_COUNT - 1;

  return (
    <FadeInView style={styles.container}>
      <Text style={styles.kicker}>{copy.title}</Text>
      <Text style={styles.progress}>
        {copy.stepProgress.replace('{{current}}', String(step + 1)).replace('{{total}}', String(STEP_COUNT))}
      </Text>

      <GlassCard style={styles.card}>
        <View style={styles.iconWrap}>
          {current.animated ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Icon size={42} color={MD3Colors.primaryFixedDim} strokeWidth={1.8} />
            </Animated.View>
          ) : (
            <Icon size={42} color={MD3Colors.primaryFixedDim} strokeWidth={1.8} />
          )}
        </View>

        <Text style={styles.stepTitle}>{current.title}</Text>
        {current.subtitle ? <Text style={styles.stepSubtitle}>{current.subtitle}</Text> : null}
      </GlassCard>

      <View style={styles.dots}>
        {steps.map((_, index) => (
          <View key={index} style={[styles.dot, index === step && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => (isLast ? onComplete() : setStep((prev) => prev + 1))}
        activeOpacity={0.85}
      >
        <Text style={styles.continueText}>{isLast ? copy.startRecording : copy.continue}</Text>
        <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  kicker: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
  },
  progress: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  card: {
    width: '100%',
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.md,
    width: '100%',
  },
  continueText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
