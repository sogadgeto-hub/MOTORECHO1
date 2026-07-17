import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, Bluetooth, BatteryLow } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { Colors, MD3Colors, Spacing, Radii } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import type { QualityIssueType } from '@/lib/audio-quality';

type RecordingAdviceProps = {
  issue?: QualityIssueType | null;
  showBluetoothWarning?: boolean;
  showBatteryWarning?: boolean;
  showRerecordRecommendation?: boolean;
};

export function RecordingAdvice({
  issue,
  showBluetoothWarning = false,
  showBatteryWarning = false,
  showRerecordRecommendation = false,
}: RecordingAdviceProps) {
  const { t } = useI18n();
  const copy = t.recordingGuide.advice;

  const messages: { key: string; text: string; icon: typeof AlertTriangle; tone: 'warning' | 'info' }[] = [];

  if (showBatteryWarning) {
    messages.push({ key: 'battery', text: copy.batteryLow, icon: BatteryLow, tone: 'warning' });
  }

  if (showBluetoothWarning) {
    messages.push({ key: 'bluetooth', text: copy.bluetoothHeadset, icon: Bluetooth, tone: 'info' });
  }

  if (issue) {
    messages.push({
      key: issue,
      text: copy.issues[issue],
      icon: AlertTriangle,
      tone: 'warning',
    });
  }

  if (showRerecordRecommendation) {
    messages.push({
      key: 'rerecord',
      text: copy.rerecordRecommendation,
      icon: AlertTriangle,
      tone: 'info',
    });
  }

  if (messages.length === 0) return null;

  return (
    <View style={styles.container}>
      {messages.map((message) => {
        const Icon = message.icon;
        const toneStyle = message.tone === 'warning' ? styles.warning : styles.info;

        return (
          <GlassCard key={message.key} style={[styles.card, toneStyle]}>
            <View style={styles.row}>
              <Icon
                size={18}
                color={message.tone === 'warning' ? Colors.warning : MD3Colors.primaryFixedDim}
                strokeWidth={2}
              />
              <Text style={styles.text}>{message.text}</Text>
            </View>
          </GlassCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.sm,
  },
  card: {
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  warning: {
    borderColor: 'rgba(255, 159, 67, 0.35)',
  },
  info: {
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  text: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
