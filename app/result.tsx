import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '@/components/FadeInView';
import {
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  ArrowLeft,
  RotateCcw,
  Clock,
  ShieldCheck,
  Gauge,
  FileText,
  Zap,
  Award,
  MessageSquarePlus,
  FlaskConical,
} from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { GlassCard } from '@/components/GlassCard';
import { DiagnosisFeedbackModal } from '@/components/DiagnosisFeedbackModal';
import { MD3Colors, Colors, Spacing, Radii } from '@/lib/theme';
import { getResultLabel, getIssueLabel, getSeverityColor } from '@/lib/analyzer';
import { useI18n } from '@/lib/i18n';

export default function ResultScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [showFeedback, setShowFeedback] = useState(false);
  const params = useLocalSearchParams<{
    result: string;
    type: string;
    confidence: string;
    severity: string;
    recommendation: string;
    recordId: string;
  }>();

  useEffect(() => {
    if (params.recordId) {
      const timer = setTimeout(() => setShowFeedback(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [params.recordId]);

  const severityColor = getSeverityColor(params.severity);
  const confidencePercent = Math.round(parseFloat(params.confidence) * 100);
  const isNormal = params.result === 'normal_engine';
  const isAnomaly = params.result === 'anomaly_detected';

  function getSeverityIcon() {
    if (isNormal) return <CheckCircle size={28} color={MD3Colors.primaryFixedDim} strokeWidth={2} />;
    if (isAnomaly) return <AlertOctagon size={28} color={MD3Colors.error} strokeWidth={2} />;
    return <AlertTriangle size={28} color={MD3Colors.tertiaryFixedDim} strokeWidth={2} />;
  }

  function getSeverityBg() {
    if (isNormal) return 'rgba(0,219,231,0.08)';
    if (isAnomaly) return 'rgba(255,180,171,0.05)';
    return 'rgba(232,196,35,0.08)';
  }

  function getSeverityBorder() {
    if (isNormal) return MD3Colors.primaryFixedDim;
    if (isAnomaly) return MD3Colors.error;
    return MD3Colors.tertiaryFixedDim;
  }

  function getSeverityGlow() {
    if (isNormal) return 'rgba(0,219,231,0.15)';
    if (isAnomaly) return 'rgba(255,180,171,0.15)';
    return 'rgba(232,196,35,0.15)';
  }

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
        </TouchableOpacity>

        <FadeInView delay={50} style={styles.betaBanner}>
          <FlaskConical size={14} color={MD3Colors.tertiaryFixedDim} strokeWidth={2} />
          <Text style={styles.betaText}>{t.result.betaBanner}</Text>
        </FadeInView>

        <FadeInView delay={100} style={styles.headerSection}>
          <View style={[styles.statusBadge, { borderColor: getSeverityBorder(), backgroundColor: getSeverityBg() }]}>
            {getSeverityIcon()}
            <Text style={[styles.statusBadgeText, { color: severityColor }]}>
              {getResultLabel(params.result)}
            </Text>
          </View>
          <Text style={styles.headerTitle}>{t.result.diagnosticReport}</Text>
          <Text style={styles.headerDate}>{t.result.generatedBy}</Text>
        </FadeInView>

        <FadeInView delay={200} style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { borderColor: severityColor, shadowColor: getSeverityBorder() }]}>
            <Text style={[styles.scoreValue, { color: severityColor }]}>{confidencePercent}%</Text>
            <Text style={styles.scoreLabel}>{t.result.confidence}</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>{getResultLabel(params.result)}</Text>
            <Text style={styles.scoreSubtitle}>
              {isNormal ? t.result.healthy.description :
               isAnomaly ? t.result.critical.description :
               t.result.monitor.description}
            </Text>
          </View>
        </FadeInView>

        <FadeInView delay={300} style={styles.detailsSection}>
          <GlassCard>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Zap size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t.result.issueCategory}</Text>
                <Text style={styles.detailValue}>
                  {params.type ? getIssueLabel(params.type) : t.result.noIssueDetected}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Gauge size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t.result.severity}</Text>
                <View style={styles.severityRow}>
                  <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
                  <Text style={[styles.detailValue, { color: severityColor }]}>
                    {params.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Award size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t.result.confidenceScore}</Text>
                <View style={styles.confidenceBar}>
                  <View style={styles.confidenceTrack}>
                    <View style={[styles.confidenceFill, { width: `${confidencePercent}%`, backgroundColor: severityColor }]} />
                  </View>
                  <Text style={styles.confidenceText}>{confidencePercent}%</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </FadeInView>

        <FadeInView delay={400} style={styles.recommendationSection}>
          <View style={styles.sectionTitleRow}>
            <ShieldCheck size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
            <Text style={styles.sectionTitle}>{t.result.recommendation}</Text>
          </View>
          <GlassCard>
            <Text style={styles.recommendationText}>{params.recommendation}</Text>
          </GlassCard>
        </FadeInView>

        <FadeInView delay={500} style={styles.possibleIssuesSection}>
          <View style={styles.sectionTitleRow}>
            <FileText size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
            <Text style={styles.sectionTitle}>{t.result.possibleIssues}</Text>
          </View>
          <View style={styles.issuesGrid}>
            <IssueChip label={t.result.issues.turbo} active={params.type === 'turbo_issue'} />
            <IssueChip label={t.result.issues.injector} active={params.type === 'injector_noise'} />
            <IssueChip label={t.result.issues.timingChain} active={params.type === 'timing_chain_noise'} />
            <IssueChip label={t.result.issues.engineKnock} active={params.type === 'engine_knocking'} />
            <IssueChip label={t.result.issues.idle} active={params.type === 'idle_instability'} />
          </View>
        </FadeInView>

        <FadeInView delay={600} style={styles.actions}>
          <TouchableOpacity
            style={styles.newAnalysisButton}
            onPress={() => router.replace('/recording')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.newAnalysisGradient}
            >
              <RotateCcw size={18} color={MD3Colors.onPrimary} strokeWidth={2} />
              <Text style={styles.newAnalysisText}>{t.result.newAnalysis}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => setShowFeedback(true)}
            activeOpacity={0.8}
          >
            <MessageSquarePlus size={16} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
            <Text style={styles.feedbackButtonText}>{t.result.feedbackButton}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.replace('/(tabs)/history')}
            activeOpacity={0.7}
          >
            <Clock size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
            <Text style={styles.historyButtonText}>{t.dashboard.viewHistory}</Text>
          </TouchableOpacity>
        </FadeInView>

        <View style={styles.spacer} />
      </ScrollView>

      <DiagnosisFeedbackModal
        visible={showFeedback}
        recordId={params.recordId ?? ''}
        onClose={() => setShowFeedback(false)}
      />
    </AppBackground>
  );
}

function IssueChip({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.issueChip, active && styles.issueChipActive]}>
      <Text style={[styles.issueChipText, active && styles.issueChipTextActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 60, paddingBottom: 40 },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  betaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(232,196,35,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232,196,35,0.15)',
  },
  betaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: MD3Colors.tertiaryFixedDim,
    flex: 1,
    lineHeight: 16,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  statusBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.text,
  },
  headerDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  scoreValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
  },
  scoreLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 4,
  },
  scoreSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  detailsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  confidenceTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.text,
    minWidth: 36,
  },
  recommendationSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  recommendationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  possibleIssuesSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  issuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  issueChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  issueChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  issueChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },
  issueChipTextActive: {
    color: Colors.primary,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  newAnalysisButton: {
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  newAnalysisGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  newAnalysisText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: MD3Colors.primaryFixedDim,
    backgroundColor: 'rgba(0,219,231,0.05)',
  },
  feedbackButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  historyButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  spacer: { height: 24 },
});
