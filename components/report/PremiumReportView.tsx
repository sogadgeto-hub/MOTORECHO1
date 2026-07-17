import { View, Text, StyleSheet } from 'react-native';
import { Activity } from 'lucide-react-native';
import { FadeInView } from '@/components/FadeInView';
import { ReportSection } from '@/components/report/ReportSection';
import { MechanicExplanationView } from '@/components/report/MechanicExplanationView';
import { MD3Colors, Spacing } from '@/lib/theme';
import type { DiagnosticIssue, GarageDiagnosticResult, PremiumDiagnosticResult } from '@/lib/diagnostic-engine';
import type { ResolvedDiagnosisExplanation, ExplainerLocale } from '@/lib/diagnostic-explainer';
import { getVehicleHealthStatus } from '@/lib/report-ui';
import type { useI18n } from '@/lib/i18n';

type ReportCopy = ReturnType<typeof useI18n>['t']['result']['report'];

type PremiumReportViewProps = {
  data: PremiumDiagnosticResult | GarageDiagnosticResult;
  issue: DiagnosticIssue;
  confidencePercent: number;
  isNormal: boolean;
  copy: ReportCopy;
  categoryLabel: string;
  explanation: ResolvedDiagnosisExplanation;
  explainerSections: ExplainerLocale['sections'];
  garageData?: GarageDiagnosticResult | null;
  workshopCopy?: ReturnType<typeof useI18n>['t']['result']['access'];
};

export function PremiumReportView({
  data,
  issue,
  confidencePercent,
  isNormal,
  copy,
  categoryLabel,
  explanation,
  explainerSections,
  garageData,
  workshopCopy,
}: PremiumReportViewProps) {
  const healthStatus = getVehicleHealthStatus(issue);

  const healthConfig = {
    normal: { emoji: '🟢', label: copy.healthGood, color: MD3Colors.primaryFixedDim },
    a_surveiller: { emoji: '🟠', label: copy.healthWatch, color: MD3Colors.tertiaryFixedDim },
    anomalie_probable: { emoji: '🔴', label: copy.healthUrgent, color: MD3Colors.error },
  }[healthStatus];

  return (
    <View style={styles.container}>
      <FadeInView delay={150}>
        <ReportSection title={copy.generalHealth} icon={<Activity size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}>
          <View style={styles.healthRow}>
            <Text style={styles.healthEmoji}>{healthConfig.emoji}</Text>
            <View style={styles.healthTextWrap}>
              <Text style={[styles.healthLabel, { color: healthConfig.color }]}>{healthConfig.label}</Text>
              <Text style={styles.healthHint}>
                {isNormal ? copy.healthGoodHint : copy.healthHint}
              </Text>
            </View>
          </View>
        </ReportSection>
      </FadeInView>

      <MechanicExplanationView
        explanation={explanation}
        sectionCopy={explainerSections}
        reportCopy={copy}
        confidencePercent={confidencePercent}
        isNormal={isNormal}
        issueName={data.nom}
        categoryLabel={categoryLabel}
      />

      {garageData && workshopCopy && (
        <FadeInView delay={520}>
          <ReportSection
            title={workshopCopy.workshopSection}
            subtitle={workshopCopy.pdfReportPlanned}
            icon={<Activity size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}
          >
            <View style={styles.garageMeta}>
              <Text style={styles.garageMetaLabel}>{workshopCopy.technicalId}</Text>
              <Text style={styles.garageMetaValue}>{garageData.idTechnique}</Text>
            </View>
            <View style={styles.garageMeta}>
              <Text style={styles.garageMetaLabel}>{workshopCopy.workshopPriority}</Text>
              <Text style={styles.garageMetaValue}>
                {workshopCopy.workshopPriorityLevels[garageData.prioriteAtelier]}
              </Text>
            </View>
          </ReportSection>
        </FadeInView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: Spacing.sm },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  healthEmoji: { fontSize: 32 },
  healthTextWrap: { flex: 1 },
  healthLabel: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 20,
    marginBottom: 4,
  },
  healthHint: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  garageMeta: { marginBottom: Spacing.sm },
  garageMetaLabel: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
    marginBottom: 2,
  },
  garageMetaValue: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
    color: MD3Colors.onSurface,
  },
});
