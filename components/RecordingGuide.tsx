import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Shield, CheckCircle2 } from 'lucide-react-native';
import { FadeInView } from '@/components/FadeInView';
import { GlassCard } from '@/components/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { Colors, MD3Colors, Palette, Spacing, Radii, IconSize, IconStroke, TouchTarget } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

type RecordingGuideProps = {
  onComplete: () => void;
};

export function RecordingGuide({ onComplete }: RecordingGuideProps) {
  const { t } = useI18n();
  const copy = t.recordingGuide;

  const checklist = [
    copy.checklist.engineIdle,
    copy.checklist.vehicleParked,
    copy.checklist.phoneNear,
    copy.checklist.noSpeaking,
    copy.checklist.quietPlace,
  ];

  const safetyRules = [
    copy.safety.stationary,
    copy.safety.parkingBrake,
    copy.safety.notWhileDriving,
    copy.safety.avoidMovingParts,
    copy.safety.avoidHotParts,
  ];

  return (
    <FadeInView style={styles.container}>
      <Text style={styles.kicker}>{copy.prepTitle}</Text>
      <Text style={styles.subtitle}>{copy.prepSubtitle}</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.card} padded>
          {checklist.map((item) => (
            <View key={item} style={styles.checkRow}>
              <CheckCircle2 size={IconSize.sm} color={MD3Colors.primaryFixedDim} strokeWidth={IconStroke.default} />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard style={[styles.card, styles.safetyCard]} padded>
          <View style={styles.safetyHeader}>
            <Shield size={IconSize.md} color={Colors.warning} strokeWidth={IconStroke.default} />
            <Text style={styles.safetyTitle}>{copy.safetyTitle}</Text>
          </View>
          {safetyRules.map((rule) => (
            <Text key={rule} style={styles.safetyText}>
              • {rule}
            </Text>
          ))}
        </GlassCard>
      </ScrollView>

      <PressableScale
        style={styles.continueButton}
        onPress={onComplete}
        haptic
        accessibilityRole="button"
        accessibilityLabel={copy.continueToRecording}
      >
        <Text style={styles.continueText}>{copy.continueToRecording}</Text>
      </PressableScale>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    gap: Spacing.md,
  },
  kicker: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  scroll: {
    width: '100%',
    maxHeight: 420,
  },
  scrollContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  card: {
    width: '100%',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  safetyCard: {
    borderColor: Colors.warningBg,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  safetyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.warning,
  },
  safetyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.md,
    width: '100%',
    minHeight: TouchTarget.min,
  },
  continueText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Palette.onPrimary,
  },
});
