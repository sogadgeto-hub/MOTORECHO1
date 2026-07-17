import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Colors, Spacing } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import type { LiveQualityState } from '@/lib/audio-quality';

type RecordingQualityIndicatorProps = {
  liveQuality: LiveQualityState;
};

export function RecordingQualityIndicator({ liveQuality }: RecordingQualityIndicatorProps) {
  const { t } = useI18n();
  const copy = t.recordingGuide.qualityIndicator;
  const labels = copy.levels;

  const indicator =
    liveQuality.indicatorLevel === 'excellent'
      ? { emoji: '🟢', label: labels.excellent, color: Colors.success }
      : liveQuality.indicatorLevel === 'good'
        ? { emoji: '🟡', label: labels.good, color: Colors.warning }
        : { emoji: '🔴', label: labels.poor, color: Colors.danger };

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>{copy.title}</Text>
      <View
        style={styles.row}
        accessibilityRole="text"
        accessibilityLabel={`${copy.title}: ${indicator.label}`}
      >
        <Text style={styles.emoji}>{indicator.emoji}</Text>
        <Text style={[styles.label, { color: indicator.color }]}>{indicator.label}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: Spacing.md,
  },
  title: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
