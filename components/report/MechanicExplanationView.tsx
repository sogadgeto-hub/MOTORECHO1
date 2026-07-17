import { View, Text, StyleSheet } from 'react-native';
import {
  AlertTriangle,
  Car,
  CircleDollarSign,
  Clock,
  Gauge,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react-native';
import { FadeInView } from '@/components/FadeInView';
import { ReportSection, ReportBodyText, ReportBulletList, ReportHighlight } from '@/components/report/ReportSection';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import type { ResolvedDiagnosisExplanation, ExplainerLocale } from '@/lib/diagnostic-explainer';
import type { useI18n } from '@/lib/i18n';

type ReportCopy = ReturnType<typeof useI18n>['t']['result']['report'];

type MechanicExplanationViewProps = {
  explanation: ResolvedDiagnosisExplanation;
  sectionCopy: ExplainerLocale['sections'];
  reportCopy: ReportCopy;
  confidencePercent: number;
  isNormal: boolean;
  issueName: string;
  categoryLabel: string;
  compact?: boolean;
};

export function MechanicExplanationView({
  explanation,
  sectionCopy,
  reportCopy,
  confidencePercent,
  isNormal,
  issueName,
  categoryLabel,
  compact = false,
}: MechanicExplanationViewProps) {
  const { diagnosis, confidence, driving, urgency, risks, garage, repair } = explanation;

  return (
    <View style={styles.container}>
      {!compact && (
        <FadeInView delay={200}>
          <ReportSection
            title={reportCopy.detectionProbability}
            subtitle={reportCopy.confidenceIndex}
            icon={<Gauge size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}
          >
            <ReportHighlight label={reportCopy.confidenceIndex} value={`${confidencePercent} %`} />
            <Text style={styles.confidenceHeadline}>{confidence.headline}</Text>
            <ReportBodyText>{confidence.text}</ReportBodyText>
          </ReportSection>
        </FadeInView>
      )}

      {!isNormal && !compact && (
        <FadeInView delay={230}>
          <ReportSection
            title={reportCopy.likelyPart}
            icon={<Wrench size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}
          >
            <Text style={styles.partName}>{issueName}</Text>
            <Text style={styles.partCategory}>{categoryLabel}</Text>
          </ReportSection>
        </FadeInView>
      )}

      <FadeInView delay={compact ? 200 : 260}>
        <ReportSection
          title={sectionCopy.diagnosis}
          icon={<Sparkles size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}
        >
          {diagnosis.paragraphs.map((paragraph, index) => (
            <Text
              key={`diag-${index}`}
              style={[styles.paragraph, index > 0 && styles.paragraphSpacing]}
            >
              {paragraph}
            </Text>
          ))}
        </ReportSection>
      </FadeInView>

      {compact && (
        <FadeInView delay={240}>
          <ReportSection
            title={sectionCopy.confidence}
            icon={<Gauge size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}
          >
            <Text style={styles.confidenceHeadline}>{confidence.headline}</Text>
            <ReportBodyText>{confidence.text}</ReportBodyText>
          </ReportSection>
        </FadeInView>
      )}

      {!isNormal && risks.items.length > 0 && (
        <FadeInView delay={compact ? 280 : 320}>
          <ReportSection
            title={sectionCopy.risks}
            icon={<AlertTriangle size={18} color={MD3Colors.tertiaryFixedDim} strokeWidth={2} />}
          >
            <ReportBodyText>{risks.intro}</ReportBodyText>
            <View style={styles.riskListWrap}>
              <ReportBulletList items={risks.items} />
            </View>
          </ReportSection>
        </FadeInView>
      )}

      <FadeInView delay={compact ? 320 : 360}>
        <ReportSection
          title={sectionCopy.driving}
          icon={<Car size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}
        >
          <View style={styles.driveBadge}>
            <Text style={styles.driveHeadline}>{driving.headline}</Text>
          </View>
          <ReportBodyText>{driving.detail}</ReportBodyText>
        </ReportSection>
      </FadeInView>

      <FadeInView delay={compact ? 360 : 400}>
        <ReportSection
          title={sectionCopy.urgency}
          icon={<ShieldCheck size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}
        >
          <View style={[styles.urgencyPill, urgencyStyle(urgency.level)]}>
            <Text style={styles.urgencyLabel}>{urgency.label}</Text>
          </View>
          <ReportBodyText>{urgency.text}</ReportBodyText>
        </ReportSection>
      </FadeInView>

      {!isNormal && (
        <FadeInView delay={compact ? 400 : 440}>
          <ReportSection
            title={sectionCopy.garage}
            icon={<MessageCircle size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}
          >
            <Text style={styles.garageRec}>{garage.recommendation}</Text>
            <Text style={styles.garageFootnote}>{garage.footnote}</Text>
          </ReportSection>
        </FadeInView>
      )}

      {!compact && !isNormal && (
        <FadeInView delay={480}>
          <ReportSection
            title={sectionCopy.repair}
            icon={<CircleDollarSign size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />}
          >
            {repair.hasEstimate ? (
              <>
                {repair.costText ? <Text style={styles.metricValue}>{repair.costText}</Text> : null}
                {repair.timeText ? (
                  <View style={styles.timeRow}>
                    <Clock size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
                    <Text style={styles.timeText}>{repair.timeText}</Text>
                  </View>
                ) : null}
                {repair.disclaimer ? <Text style={styles.disclaimer}>{repair.disclaimer}</Text> : null}
              </>
            ) : (
              <ReportBodyText>{repair.fallbackText}</ReportBodyText>
            )}
          </ReportSection>
        </FadeInView>
      )}
    </View>
  );
}

function urgencyStyle(level: string) {
  switch (level) {
    case 'very_low':
    case 'low':
      return { backgroundColor: 'rgba(0,219,231,0.12)', borderColor: 'rgba(0,219,231,0.25)' };
    case 'medium':
      return { backgroundColor: 'rgba(232,196,35,0.12)', borderColor: 'rgba(232,196,35,0.25)' };
    case 'high':
      return { backgroundColor: 'rgba(255,180,171,0.12)', borderColor: 'rgba(255,180,171,0.25)' };
    case 'critical':
      return { backgroundColor: 'rgba(255,100,100,0.15)', borderColor: 'rgba(255,100,100,0.3)' };
    default:
      return { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' };
  }
}

const styles = StyleSheet.create({
  container: { paddingTop: Spacing.sm },
  paragraph: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 24,
  },
  paragraphSpacing: { marginTop: Spacing.md },
  confidenceHeadline: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
    color: MD3Colors.onSurface,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  partName: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 22,
    color: MD3Colors.onSurface,
    marginBottom: 4,
  },
  partCategory: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
  },
  riskListWrap: { marginTop: Spacing.sm },
  driveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,219,231,0.1)',
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,219,231,0.2)',
  },
  driveHeadline: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: MD3Colors.primaryFixedDim,
  },
  urgencyPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  urgencyLabel: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
    color: MD3Colors.onSurface,
  },
  garageRec: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 16,
    color: MD3Colors.onSurface,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  garageFootnote: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 19,
  },
  metricValue: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 24,
    color: MD3Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  timeText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
  },
  disclaimer: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
});
