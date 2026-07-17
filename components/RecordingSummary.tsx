import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { HealthScoreGauge } from '@/components/HealthScoreGauge';
import { Colors, Spacing } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import type { RecordingQuality } from '@/lib/audio-quality';

type RecordingSummaryProps = {
  quality: RecordingQuality;
};

export function RecordingSummary({ quality }: RecordingSummaryProps) {
  const { t } = useI18n();
  const copy = t.recordingGuide.summary;
  const levelLabel = copy.levels[quality.qualityLevel];

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>{copy.title}</Text>
      <HealthScoreGauge
        score={quality.qualityScore}
        size={140}
        strokeWidth={12}
        label={copy.scoreLabel}
      />
      <Text style={styles.level}>{levelLabel}</Text>
      <View style={styles.metaRow}>
        <MetaItem label={copy.duration} value={`${(quality.recordingDuration / 1000).toFixed(1)}s`} />
        <MetaItem
          label={copy.volume}
          value={`${Math.round(quality.averageVolume * 100)}%`}
        />
      </View>
    </GlassCard>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
    alignSelf: 'flex-start',
  },
  level: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  metaValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
    marginTop: 2,
  },
});
