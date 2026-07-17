import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Colors, Spacing, Radii } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

type RecordingQualityBarProps = {
  score: number;
};

export function RecordingQualityBar({ score }: RecordingQualityBarProps) {
  const { t } = useI18n();
  const copy = t.recordingGuide.qualityBar;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(100, score));

  const fillColor =
    clamped >= 75 ? Colors.success : clamped >= 50 ? Colors.warning : Colors.danger;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [clamped, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={[styles.score, { color: fillColor }]}>{clamped}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: animatedWidth, backgroundColor: fillColor }]} />
      </View>
      <View style={styles.scale}>
        <Text style={styles.scaleText}>0</Text>
        <Text style={styles.scaleText}>100</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },
  score: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 8,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radii.sm,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scaleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
});
