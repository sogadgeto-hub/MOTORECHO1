import { useState, useMemo, useEffect } from 'react';
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
  FlaskConical,
  MessageSquarePlus,
  Activity,
} from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { DiagnosisFeedbackModal } from '@/components/DiagnosisFeedbackModal';
import { ReportFeedbackSheet } from '@/components/ReportFeedbackSheet';
import { PremiumReportView } from '@/components/report/PremiumReportView';
import { FreeReportView } from '@/components/report/FreeReportView';
import { MD3Colors, Spacing, Radii, Colors } from '@/lib/theme';
import { hapticSuccess } from '@/lib/haptics';
import { getSeverityColor } from '@/lib/analyzer';
import { useAuth } from '@/lib/auth';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useI18n } from '@/lib/i18n';
import { navigateToVehicleHealth } from '@/lib/navigation';
import {
  buildDiagnosticResult,
  clampConfidence,
  resolveIssueFromAnalysis,
  type FreeDiagnosticResult,
  type GarageDiagnosticResult,
  type PremiumDiagnosticResult,
  type IssueCategory,
  type UserPlan,
} from '@/lib/diagnostic-engine';
import {
  buildDiagnosisExplanation,
  buildExplainerInput,
  type ExplainerLocale,
} from '@/lib/diagnostic-explainer';

const ENABLE_REPORT_DEBUG_SELECTOR = false;
const DEBUG_PLAN_OPTIONS: UserPlan[] = ['free', 'premium', 'garage'];

export default function ResultScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const {
    subscription,
    plan: enginePlan,
    loading: planLoading,
    getDefaultReportTier,
  } = useSubscriptionAccess(user?.id);
  const [showVoluntaryFeedback, setShowVoluntaryFeedback] = useState(false);
  const [showExitFeedback, setShowExitFeedback] = useState(false);
  const [devPreviewPlan, setDevPreviewPlan] = useState<UserPlan>('free');
  const params = useLocalSearchParams<{
    result: string;
    type: string;
    confidence: string;
    severity: string;
    recommendation: string;
    recordId: string;
    isSimulated?: string;
    fromAnalysis?: string;
    vehicleId?: string;
  }>();

  const isSimulated = params.isSimulated === '1';
  const fromAnalysis = params.fromAnalysis === '1';

  useEffect(() => {
    if (fromAnalysis) {
      void hapticSuccess();
    }
  }, [fromAnalysis]);

  const effectiveReportTier = planLoading ? 'free' : getDefaultReportTier();
  const reportTier =
    __DEV__ && ENABLE_REPORT_DEBUG_SELECTOR ? devPreviewPlan : effectiveReportTier;

  const safeConfidence = useMemo(
    () => clampConfidence(parseFloat(params.confidence) || 0),
    [params.confidence]
  );

  const confidencePercent = Math.round(safeConfidence * 100);

  const issue = useMemo(
    () => resolveIssueFromAnalysis(params.result, params.type || null),
    [params.result, params.type]
  );

  const accessResult = useMemo(
    () => buildDiagnosticResult(issue, reportTier, safeConfidence),
    [issue, reportTier, safeConfidence]
  );

  const freeAccess = reportTier === 'free' ? (accessResult as FreeDiagnosticResult) : null;
  const premiumAccess =
    reportTier === 'premium' ? (accessResult as PremiumDiagnosticResult) : null;
  const garageAccess =
    reportTier === 'garage' ? (accessResult as GarageDiagnosticResult) : null;

  const isFree = reportTier === 'free';
  const isGarage = reportTier === 'garage';
  const isPaid = reportTier === 'premium' || isGarage;

  const isNormal = params.result === 'normal_engine';
  const isAnomaly = params.result === 'anomaly_detected';
  const severityColor = getSeverityColor(params.severity);

  const explainerInput = useMemo(
    () =>
      buildExplainerInput(issue, premiumAccess ?? garageAccess, {
        analysisResult: params.result,
        confidence: safeConfidence,
        isNormal,
      }),
    [issue, premiumAccess, garageAccess, params.result, safeConfidence, isNormal]
  );

  const diagnosisExplanation = useMemo(
    () => buildDiagnosisExplanation(explainerInput, t.explainer as ExplainerLocale),
    [explainerInput, t.explainer]
  );

  function categoryLabel(categorie: IssueCategory) {
    return t.result.access.categories[categorie];
  }

  function navigateHome() {
    router.replace('/(tabs)');
  }

  function handleLeaveReport() {
    if (fromAnalysis && params.recordId) {
      setShowExitFeedback(true);
      return;
    }
    navigateHome();
  }

  function handleExitFeedbackComplete() {
    setShowExitFeedback(false);
    navigateHome();
  }

  if (planLoading && !__DEV__) {
    return (
      <AppBackground>
        <View style={styles.planLoadingContainer}>
          <Text style={styles.planLoadingText}>{t.limits.checkingLimits}</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={handleLeaveReport} activeOpacity={0.7}>
          <ArrowLeft size={24} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
        </TouchableOpacity>

        <FadeInView delay={50} style={styles.betaBanner}>
          <FlaskConical size={14} color={MD3Colors.tertiaryFixedDim} strokeWidth={2} />
          <Text style={styles.betaText}>
            {isSimulated ? t.result.simulatedBanner : t.result.betaBanner}
          </Text>
        </FadeInView>

        {__DEV__ && ENABLE_REPORT_DEBUG_SELECTOR && (
          <View style={styles.devPreviewBar}>
            <Text style={styles.devPreviewLabel}>
              DEV — reportTier (effectif : {enginePlan} / RC : {subscription.plan})
            </Text>
            <View style={styles.devPreviewOptions}>
              {DEBUG_PLAN_OPTIONS.map((plan) => (
                <TouchableOpacity
                  key={plan}
                  style={[
                    styles.devPreviewOption,
                    devPreviewPlan === plan && styles.devPreviewOptionActive,
                  ]}
                  onPress={() => setDevPreviewPlan(plan)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.devPreviewOptionText,
                      devPreviewPlan === plan && styles.devPreviewOptionTextActive,
                    ]}
                  >
                    {plan}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <FadeInView delay={100} style={styles.headerSection}>
          <View
            style={[
              styles.statusBadge,
              {
                borderColor: getStatusBorder(isNormal, isAnomaly),
                backgroundColor: getStatusBg(isNormal, isAnomaly),
              },
            ]}
          >
            {getStatusIcon(isNormal, isAnomaly)}
            <Text style={[styles.statusBadgeText, { color: severityColor }]}>
              {t.result.report.completed}
            </Text>
          </View>
          <Text style={styles.headerTitle}>{t.result.diagnosticReport}</Text>
          <Text style={styles.headerDate}>{t.result.generatedBy}</Text>
        </FadeInView>

        {isFree && freeAccess && (
          <FreeReportView
            data={freeAccess}
            issue={issue}
            copy={t.result.report}
            accessCopy={t.result.access}
            categoryLabel={categoryLabel(issue.categorie)}
            explanation={diagnosisExplanation}
            explainerSections={t.explainer.sections}
            confidencePercent={confidencePercent}
            isNormal={isNormal}
            issueName={issue.nom}
            onUpgrade={() => router.push('/premium')}
            upgradeLabel={t.result.access.upgradeToPremium}
            lockedTitle={t.result.access.lockedTitle}
            lockedDescription={t.result.access.lockedDescription}
          />
        )}

        {isPaid && (premiumAccess || garageAccess) && (
          <PremiumReportView
            data={(premiumAccess ?? garageAccess)!}
            issue={issue}
            confidencePercent={confidencePercent}
            isNormal={isNormal}
            copy={t.result.report}
            categoryLabel={categoryLabel((premiumAccess ?? garageAccess)!.categorie)}
            explanation={diagnosisExplanation}
            explainerSections={t.explainer.sections}
            garageData={garageAccess}
            workshopCopy={t.result.access}
          />
        )}

        <FadeInView delay={700} style={styles.actions}>
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
            onPress={() => setShowVoluntaryFeedback(true)}
            activeOpacity={0.8}
          >
            <MessageSquarePlus size={16} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
            <Text style={styles.feedbackButtonText}>{t.result.helpMotorEcho}</Text>
          </TouchableOpacity>

          {params.vehicleId && params.vehicleId.length > 0 ? (
            <TouchableOpacity
              style={styles.healthButton}
              onPress={() => navigateToVehicleHealth(router, params.vehicleId!)}
              activeOpacity={0.8}
            >
              <Activity size={16} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
              <Text style={styles.healthButtonText}>{t.vehicleHealth.viewDashboard}</Text>
            </TouchableOpacity>
          ) : null}

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

      <ReportFeedbackSheet
        visible={showExitFeedback}
        recordId={params.recordId ?? ''}
        onComplete={handleExitFeedbackComplete}
        onSkip={handleExitFeedbackComplete}
      />

      <DiagnosisFeedbackModal
        visible={showVoluntaryFeedback}
        recordId={params.recordId ?? ''}
        onClose={() => setShowVoluntaryFeedback(false)}
      />
    </AppBackground>
  );
}

function getStatusIcon(isNormal: boolean, isAnomaly: boolean) {
  if (isNormal) {
    return <CheckCircle size={28} color={MD3Colors.primaryFixedDim} strokeWidth={2} />;
  }
  if (isAnomaly) {
    return <AlertOctagon size={28} color={MD3Colors.error} strokeWidth={2} />;
  }
  return <AlertTriangle size={28} color={MD3Colors.tertiaryFixedDim} strokeWidth={2} />;
}

function getStatusBorder(isNormal: boolean, isAnomaly: boolean) {
  if (isNormal) return MD3Colors.primaryFixedDim;
  if (isAnomaly) return MD3Colors.error;
  return MD3Colors.tertiaryFixedDim;
}

function getStatusBg(isNormal: boolean, isAnomaly: boolean) {
  if (isNormal) return Colors.successBg;
  if (isAnomaly) return Colors.dangerBg;
  return Colors.warningBg;
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 60, paddingBottom: 48 },
  planLoadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  planLoadingText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 16,
    color: MD3Colors.onSurfaceVariant,
  },
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
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 11,
    color: MD3Colors.tertiaryFixedDim,
    flex: 1,
    lineHeight: 16,
  },
  devPreviewBar: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 100, 100, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.25)',
    gap: Spacing.sm,
  },
  devPreviewLabel: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 11,
    color: '#FF8A80',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  devPreviewOptions: { flexDirection: 'row', gap: Spacing.sm },
  devPreviewOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  devPreviewOptionActive: {
    borderColor: '#FF8A80',
    backgroundColor: 'rgba(255, 100, 100, 0.15)',
  },
  devPreviewOptionText: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  devPreviewOptionTextActive: { color: '#FF8A80' },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
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
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 28,
    color: MD3Colors.onSurface,
    textAlign: 'center',
  },
  headerDate: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    marginTop: 4,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  newAnalysisButton: { borderRadius: Radii.md, overflow: 'hidden' },
  newAnalysisGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  newAnalysisText: {
    fontFamily: 'HankenGrotesk-SemiBold',
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
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  feedbackButtonText: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
  },
  healthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(0,219,231,0.25)',
    backgroundColor: 'rgba(0,219,231,0.06)',
  },
  healthButtonText: {
    fontFamily: 'HankenGrotesk-Medium',
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
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 15,
    color: MD3Colors.onSurfaceVariant,
  },
  spacer: { height: 24 },
});
