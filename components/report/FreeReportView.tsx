import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Gauge, Lock, Zap } from 'lucide-react-native';
import { FadeInView } from '@/components/FadeInView';
import { ReportSection } from '@/components/report/ReportSection';
import { MechanicExplanationView } from '@/components/report/MechanicExplanationView';
import { GlassCard } from '@/components/GlassCard';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import type { DiagnosticIssue, FreeDiagnosticResult } from '@/lib/diagnostic-engine';
import type { ResolvedDiagnosisExplanation, ExplainerLocale } from '@/lib/diagnostic-explainer';
import { getVehicleHealthStatus } from '@/lib/report-ui';
import type { useI18n } from '@/lib/i18n';

type ReportCopy = ReturnType<typeof useI18n>['t']['result']['report'];
type AccessCopy = ReturnType<typeof useI18n>['t']['result']['access'];

type FreeReportViewProps = {
  data: FreeDiagnosticResult;
  issue: DiagnosticIssue;
  copy: ReportCopy;
  accessCopy: AccessCopy;
  categoryLabel: string;
  explanation: ResolvedDiagnosisExplanation;
  explainerSections: ExplainerLocale['sections'];
  confidencePercent: number;
  isNormal: boolean;
  issueName: string;
  onUpgrade: () => void;
  upgradeLabel: string;
  lockedTitle: string;
  lockedDescription: string;
};

export function FreeReportView({
  data,
  issue,
  copy,
  accessCopy,
  categoryLabel,
  explanation,
  explainerSections,
  confidencePercent,
  isNormal,
  issueName,
  onUpgrade,
  upgradeLabel,
  lockedTitle,
  lockedDescription,
}: FreeReportViewProps) {
  const healthStatus = getVehicleHealthStatus(issue);
  const healthConfig = {
    normal: { emoji: '🟢', label: copy.healthGood },
    a_surveiller: { emoji: '🟠', label: copy.healthWatch },
    anomalie_probable: { emoji: '🔴', label: copy.healthUrgent },
  }[healthStatus];

  return (
    <View style={styles.container}>
      <FadeInView delay={150}>
        <ReportSection title={copy.generalHealth} icon={<Activity size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}>
          <View style={styles.healthRow}>
            <Text style={styles.healthEmoji}>{healthConfig.emoji}</Text>
            <Text style={styles.healthLabel}>{healthConfig.label}</Text>
          </View>
        </ReportSection>
      </FadeInView>

      <FadeInView delay={200}>
        <ReportSection title={copy.summary} icon={<Zap size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{copy.category}</Text>
            <Text style={styles.summaryValue}>{categoryLabel}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{copy.severity}</Text>
            <Text style={styles.summaryValue}>
              {accessCopy.simplifiedSeverity[data.graviteSimplifiee]}
            </Text>
          </View>
        </ReportSection>
      </FadeInView>

      <MechanicExplanationView
        explanation={explanation}
        sectionCopy={explainerSections}
        reportCopy={copy}
        confidencePercent={confidencePercent}
        isNormal={isNormal}
        issueName={issueName}
        categoryLabel={categoryLabel}
        compact
      />

      <FadeInView delay={300} style={styles.lockedWrap}>
        <GlassCard style={styles.lockedCard}>
          <View style={styles.lockedHeader}>
            <Lock size={20} color={MD3Colors.tertiaryFixedDim} strokeWidth={2} />
            <Text style={styles.lockedTitle}>{lockedTitle}</Text>
          </View>
          <Text style={styles.lockedDescription}>{lockedDescription}</Text>
          <View style={styles.lockedPreview}>
            <Gauge size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
            <Text style={styles.lockedPreviewText}>{copy.premiumPreviewHint}</Text>
          </View>
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade} activeOpacity={0.85}>
            <LinearGradient
              colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <Text style={styles.upgradeButtonText}>{upgradeLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </GlassCard>
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: Spacing.sm },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  healthEmoji: { fontSize: 32 },
  healthLabel: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 20,
    color: MD3Colors.onSurface,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
  },
  summaryValue: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
    color: MD3Colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: Spacing.sm,
  },
  lockedWrap: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  lockedCard: { gap: Spacing.md },
  lockedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  lockedTitle: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: MD3Colors.onSurface,
  },
  lockedDescription: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  lockedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  lockedPreviewText: {
    flex: 1,
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  upgradeButton: { borderRadius: Radii.md, overflow: 'hidden', marginTop: Spacing.xs },
  upgradeGradient: { paddingVertical: Spacing.md, alignItems: 'center' },
  upgradeButtonText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
    color: MD3Colors.onPrimary,
  },
});
