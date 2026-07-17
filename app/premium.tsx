import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '@/components/FadeInView';
import { ArrowLeft, Check, Crown, Building2, Zap, FileText, Clock, Shield, Car } from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { GlassCard } from '@/components/GlassCard';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useI18n } from '@/lib/i18n';

type PlanType = 'free' | 'premium' | 'garage';

export default function PremiumScreen() {
  const router = useRouter();
  const {
    plan: serverPlan,
    getPriceLabel,
    purchasePlan,
    refresh,
    offeringsLoading,
    offeringsError,
  } = useSubscriptionAccess();
  const { t } = useI18n();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedPlan(serverPlan);
  }, [serverPlan]);

  const plans = [
    {
      id: 'free' as PlanType,
      name: t.premium.plans.free.name,
      period: t.premium.plans.free.period,
      features: [
        { text: t.premium.plans.free.features.vehicle, included: true },
        { text: t.premium.plans.free.features.analyses, included: true },
        { text: t.premium.plans.free.features.diagnostic, included: true },
        { text: t.premium.plans.free.features.history, included: true },
        { text: t.premium.plans.free.features.advancedAI, included: false },
        { text: t.premium.plans.free.features.pdfExport, included: false },
        { text: t.premium.plans.free.features.alerts, included: false },
        { text: t.premium.plans.free.features.fleetManagement, included: false },
      ],
    },
    {
      id: 'premium' as PlanType,
      name: t.premium.plans.premium.name,
      period: t.premium.plans.premium.period,
      isPopular: true,
      features: [
        { text: t.premium.plans.premium.features.vehicles, included: true },
        { text: t.premium.plans.premium.features.analyses, included: true },
        { text: t.premium.plans.premium.features.diagnostic, included: true },
        { text: t.premium.plans.premium.features.history, included: true },
        { text: t.premium.plans.premium.features.pdfExport, included: true },
        { text: t.premium.plans.premium.features.alerts, included: true },
        { text: t.premium.plans.premium.features.monitoring, included: true },
        { text: 'Fleet management', included: false },
      ],
    },
    {
      id: 'garage' as PlanType,
      name: t.premium.plans.garage.name,
      period: t.premium.plans.garage.period,
      highlight: true,
      features: [
        { text: t.premium.plans.garage.features.vehicles, included: true },
        { text: t.premium.plans.garage.features.analyses, included: true },
        { text: t.premium.plans.garage.features.dashboard, included: true },
        { text: t.premium.plans.garage.features.fleetManagement, included: true },
        { text: t.premium.plans.garage.features.history, included: true },
        { text: t.premium.plans.garage.features.reports, included: true },
        { text: t.premium.plans.garage.features.support, included: true },
        { text: t.premium.plans.garage.features.business, included: true },
      ],
    },
  ];

  function resolvePriceLabel(plan: PlanType): string {
    if (plan === 'free') {
      return t.premium.plans.free.name;
    }

    if (offeringsLoading) {
      return t.common.loading;
    }

    const label = getPriceLabel(plan, billingCycle);
    return label ?? '—';
  }

  async function handleUpgrade(plan: PlanType) {
    if (plan === 'free') {
      router.back();
      return;
    }

    if (offeringsError === 'empty' || offeringsError === 'not_configured') {
      setPurchaseMessage(t.premium.purchase.noOfferings);
      return;
    }

    if (offeringsError === 'network') {
      setPurchaseMessage(t.premium.purchase.networkError);
      return;
    }

    setLoading(true);
    setPurchaseMessage(null);

    try {
      const result = await purchasePlan(plan, billingCycle);

      if (result.ok) {
        await refresh();
        router.back();
        return;
      }

      if (result.cancelled) {
        return;
      }

      if (result.reason === 'no_package') {
        setPurchaseMessage(t.premium.purchase.noPackage);
        return;
      }

      setPurchaseMessage(t.premium.purchase.failed);
    } finally {
      setLoading(false);
    }
  }

  const offeringsBannerMessage =
    offeringsError === 'network'
      ? t.premium.purchase.networkError
      : offeringsError === 'empty' || offeringsError === 'not_configured'
        ? t.premium.purchase.noOfferings
        : null;

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={24} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
        </TouchableOpacity>

        <FadeInView delay={100} style={styles.headerSection}>
          <View style={styles.crownBadge}>
            <Crown size={32} color="#FFFFFF" strokeWidth={1.5} />
          </View>
          <Text style={styles.headerTitle}>{t.premium.choosePlan}</Text>
          <Text style={styles.headerSubtitle}>{t.premium.subtitle}</Text>
        </FadeInView>

        {(offeringsBannerMessage || purchaseMessage) && (
          <FadeInView delay={120} style={styles.messageBanner}>
            <Text style={styles.messageBannerText}>{purchaseMessage ?? offeringsBannerMessage}</Text>
          </FadeInView>
        )}

        {/* Billing Cycle Toggle */}
        <FadeInView delay={150} style={styles.billingToggle}>
          <TouchableOpacity
            style={[styles.billingOption, billingCycle === 'monthly' && styles.billingOptionActive]}
            onPress={() => setBillingCycle('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.billingText, billingCycle === 'monthly' && styles.billingTextActive]}>{t.premium.billing.monthly}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingOption, billingCycle === 'yearly' && styles.billingOptionActive]}
            onPress={() => setBillingCycle('yearly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.billingText, billingCycle === 'yearly' && styles.billingTextActive]}>{t.premium.billing.yearly}</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>{t.premium.billing.save}</Text>
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* Plans */}
        <FadeInView delay={200} style={styles.plansContainer}>
          {plans.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlan === plan.id}
              isCurrentPlan={serverPlan === plan.id}
              billingCycle={billingCycle}
              priceLabel={resolvePriceLabel(plan.id)}
              onSelect={() => setSelectedPlan(plan.id)}
              onUpgrade={() => handleUpgrade(plan.id)}
              loading={loading}
              delay={index * 100}
              t={t}
            />
          ))}
        </FadeInView>

        {/* Comparison Table */}
        <FadeInView delay={400} style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>{t.premium.comparison.title}</Text>
          <GlassCard>
            <View style={styles.comparisonTable}>
              <View style={styles.comparisonHeader}>
                <View style={styles.comparisonFeatureCol}>
                  <Text style={styles.comparisonHeaderText}>{t.premium.comparison.feature}</Text>
                </View>
                <View style={styles.comparisonPlanCol}>
                  <Text style={styles.comparisonHeaderText}>{t.premium.plans.free.name}</Text>
                </View>
                <View style={styles.comparisonPlanCol}>
                  <Text style={[styles.comparisonHeaderText, { color: MD3Colors.primaryFixedDim }]}>{t.premium.plans.premium.name}</Text>
                </View>
                <View style={styles.comparisonPlanCol}>
                  <Text style={[styles.comparisonHeaderText, { color: MD3Colors.tertiaryFixedDim }]}>{t.premium.plans.garage.name}</Text>
                </View>
              </View>

              <ComparisonRow label={t.premium.comparison.vehicles} values={['1', '2', t.premium.plans.garage.features.vehicles.split(' ')[0]]} />
              <ComparisonRow label={t.premium.comparison.analysesMonth} values={['3', t.premium.plans.premium.features.analyses.split(' ')[0], t.premium.plans.premium.features.analyses.split(' ')[0]]} />
              <ComparisonRow label={t.premium.comparison.history} values={['30 days', t.premium.plans.premium.features.history, t.premium.plans.premium.features.history]} />
              <ComparisonRow label={t.premium.comparison.pdfExport} values={[false, true, true]} />
              <ComparisonRow label={t.premium.comparison.maintenanceAlerts} values={[false, true, true]} />
              <ComparisonRow label={t.premium.comparison.fleetManagement} values={[false, false, true]} />
              <ComparisonRow label={t.premium.comparison.prioritySupport} values={[false, true, true]} />
              <ComparisonRow label={t.premium.comparison.advancedReports} values={[false, true, true]} last />
            </View>
          </GlassCard>
        </FadeInView>

        <FadeInView delay={500} style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>{t.premium.features.title}</Text>
          <FeatureCard icon={Zap} title={t.premium.features.unlimitedAnalyses.title} description={t.premium.features.unlimitedAnalyses.description} delay={100} />
          <FeatureCard icon={FileText} title={t.premium.features.advancedReports.title} description={t.premium.features.advancedReports.description} delay={200} />
          <FeatureCard icon={Clock} title={t.premium.features.completeHistory.title} description={t.premium.features.completeHistory.description} delay={300} />
          <FeatureCard icon={Car} title={t.premium.features.vehicleTracking.title} description={t.premium.features.vehicleTracking.description} delay={400} />
          <FeatureCard icon={Shield} title={t.premium.features.priorityAnalysis.title} description={t.premium.features.priorityAnalysis.description} delay={500} />
        </FadeInView>

        <View style={styles.spacer} />
      </ScrollView>
    </AppBackground>
  );
}

type PlanFeature = { text: string; included: boolean };
type Plan = {
  id: PlanType;
  name: string;
  period: string;
  isPopular?: boolean;
  highlight?: boolean;
  features: PlanFeature[];
};

function PlanCard({ plan, isSelected, isCurrentPlan, billingCycle, priceLabel, onSelect, onUpgrade, loading, delay, t }: {
  plan: Plan;
  isSelected: boolean;
  isCurrentPlan: boolean;
  billingCycle: 'monthly' | 'yearly';
  priceLabel: string;
  onSelect: () => void;
  onUpgrade: () => void;
  loading: boolean;
  delay: number;
  t: any;
}) {
  const pricePeriodLabel = billingCycle === 'yearly' ? t.premium.perYear : t.premium.perMonth;
  const isFreePlan = plan.id === 'free';

  return (
    <FadeInView delay={delay}>
      <TouchableOpacity
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          plan.isPopular && styles.planCardPopular,
          plan.highlight && styles.planCardGarage,
        ]}
        onPress={onSelect}
        activeOpacity={0.85}
      >
        {plan.isPopular && (
          <View style={styles.bestValueBadge}>
            <Text style={styles.bestValueText}>Best Value</Text>
          </View>
        )}
        {plan.highlight && (
          <View style={styles.proBadge}>
            <Building2 size={14} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.planPriceRow}>
            <Text style={[styles.planPrice, plan.isPopular && styles.planPricePremium, plan.highlight && styles.planPriceGarage]}>
              {priceLabel}
            </Text>
            {!isFreePlan && priceLabel !== t.common.loading && priceLabel !== '—' && (
              <Text style={styles.planPeriod}>{pricePeriodLabel}</Text>
            )}
          </View>
        </View>

        <View style={styles.planFeatures}>
          {plan.features.slice(0, 5).map((f: PlanFeature, i: number) => (
            <View key={i} style={styles.planFeature}>
              <View style={[styles.planFeatureDot, f.included && styles.planFeatureDotIncluded, plan.isPopular && styles.planFeatureDotPremium, plan.highlight && styles.planFeatureDotGarage]}>
                {f.included && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={[styles.planFeatureText, !f.included && styles.planFeatureTextNotIncluded]}>{f.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.planButton,
            isCurrentPlan && styles.planButtonCurrent,
            plan.isPopular && styles.planButtonPremium,
            plan.highlight && styles.planButtonGarage,
          ]}
          onPress={onUpgrade}
          disabled={loading || isCurrentPlan}
          activeOpacity={0.85}
        >
          {plan.isPopular && !isCurrentPlan && (
            <LinearGradient colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]} style={styles.planButtonGradient}>
              <Text style={styles.planButtonText}>{loading ? t.common.loading : t.premium.upgradeNow}</Text>
            </LinearGradient>
          )}
          {plan.highlight && !isCurrentPlan && (
            <LinearGradient colors={[MD3Colors.tertiaryFixedDim, MD3Colors.tertiaryFixed]} style={styles.planButtonGradient}>
              <Text style={styles.planButtonText}>{loading ? t.common.loading : t.premium.upgradeNow}</Text>
            </LinearGradient>
          )}
          {(!plan.isPopular && !plan.highlight) && (
            <Text style={[styles.planButtonText, { color: MD3Colors.onSurfaceVariant }]}>
              {isCurrentPlan ? t.premium.currentPlan : t.common.confirm}
            </Text>
          )}
          {isCurrentPlan && (
            <Text style={[styles.planButtonText, { color: MD3Colors.primaryFixedDim }]}>
              {t.premium.currentPlan}
            </Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </FadeInView>
  );
}

function ComparisonRow({ label, values, last }: { label: string; values: (string | boolean)[]; last?: boolean }) {
  return (
    <View style={[styles.comparisonRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.comparisonFeatureCol}>
        <Text style={styles.comparisonLabel}>{label}</Text>
      </View>
      {values.map((v, i) => (
        <View key={i} style={styles.comparisonPlanCol}>
          {typeof v === 'boolean' ? (
            v ? (
              <Check size={16} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
            ) : (
              <Text style={styles.comparisonDisabled}>-</Text>
            )
          ) : (
            <Text style={styles.comparisonValue}>{v}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }: { icon: typeof Zap; title: string; description: string; delay: number }) {
  return (
    <FadeInView delay={delay} style={styles.featureCard}>
      <GlassCard style={styles.featureCardInner}>
        <View style={styles.featureIcon}>
          <Icon size={20} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
        </View>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
      </GlassCard>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 56, paddingBottom: 40 },
  backButton: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  headerSection: { alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  crownBadge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: MD3Colors.primaryFixedDim,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: MD3Colors.primaryFixedDim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  headerTitle: { fontFamily: 'HankenGrotesk-Bold', fontSize: 28, color: MD3Colors.onSurface, marginBottom: 4 },
  headerSubtitle: { fontFamily: 'HankenGrotesk-Regular', fontSize: 14, color: MD3Colors.onSurfaceVariant, textAlign: 'center' },

  messageBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 100, 100, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.25)',
  },
  messageBannerText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurface,
    textAlign: 'center',
  },

  billingToggle: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: MD3Colors.surfaceContainer,
    borderRadius: Radii.md,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.sm,
    gap: 6,
  },
  billingOptionActive: {
    backgroundColor: MD3Colors.surface,
  },
  billingText: { fontFamily: 'HankenGrotesk-Medium', fontSize: 14, color: MD3Colors.onSurfaceVariant },
  billingTextActive: { color: MD3Colors.onSurface },
  saveBadge: {
    backgroundColor: MD3Colors.primaryFixedDim,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saveBadgeText: { fontFamily: 'HankenGrotesk-Bold', fontSize: 9, color: '#FFFFFF' },

  plansContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.xl },

  planCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: MD3Colors.surfaceContainer,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  planCardSelected: { borderColor: MD3Colors.primaryFixedDim },
  planCardPopular: {
    borderColor: MD3Colors.primaryFixedDim,
    backgroundColor: 'rgba(0,219,231,0.04)',
  },
  planCardGarage: {
    borderColor: MD3Colors.tertiaryFixedDim,
    backgroundColor: 'rgba(232,196,35,0.04)',
  },
  bestValueBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: MD3Colors.primaryFixedDim,
    borderBottomLeftRadius: Radii.md,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  bestValueText: { fontFamily: 'HankenGrotesk-Bold', fontSize: 10, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 },
  proBadge: {
    position: 'absolute', top: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MD3Colors.tertiaryFixedDim,
    borderBottomLeftRadius: Radii.md,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  proBadgeText: { fontFamily: 'HankenGrotesk-Bold', fontSize: 10, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 },
  planHeader: { marginBottom: Spacing.md },
  planName: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 18, color: MD3Colors.onSurface, marginBottom: 4 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  planPrice: { fontFamily: 'HankenGrotesk-Bold', fontSize: 36, color: MD3Colors.onSurface },
  planPricePremium: { color: MD3Colors.primaryFixedDim },
  planPriceGarage: { color: MD3Colors.tertiaryFixedDim },
  planPeriod: { fontFamily: 'HankenGrotesk-Regular', fontSize: 14, color: MD3Colors.onSurfaceVariant },
  planFeatures: { gap: 8, marginBottom: Spacing.lg },
  planFeature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planFeatureDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  planFeatureDotIncluded: { backgroundColor: MD3Colors.primaryFixedDim, borderColor: MD3Colors.primaryFixedDim },
  planFeatureDotPremium: { backgroundColor: MD3Colors.primaryFixedDim, borderColor: MD3Colors.primaryFixedDim },
  planFeatureDotGarage: { backgroundColor: MD3Colors.tertiaryFixedDim, borderColor: MD3Colors.tertiaryFixedDim },
  planFeatureText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant },
  planFeatureTextNotIncluded: { opacity: 0.4 },
  planButton: { borderRadius: Radii.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: MD3Colors.surfaceContainerHigh },
  planButtonCurrent: { backgroundColor: 'transparent' },
  planButtonPremium: { backgroundColor: 'transparent' },
  planButtonGarage: { backgroundColor: 'transparent' },
  planButtonGradient: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  planButtonText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 14, color: '#FFFFFF' },

  comparisonSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  comparisonTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 18, color: MD3Colors.onSurface, marginBottom: Spacing.md },
  comparisonTable: { padding: Spacing.sm },
  comparisonHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: Spacing.sm, marginBottom: Spacing.sm },
  comparisonFeatureCol: { flex: 1.4 },
  comparisonPlanCol: { flex: 1, alignItems: 'center' },
  comparisonHeaderText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 12, color: MD3Colors.onSurfaceVariant },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  comparisonLabel: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant },
  comparisonValue: { fontFamily: 'HankenGrotesk-Medium', fontSize: 13, color: MD3Colors.onSurface },
  comparisonDisabled: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant, opacity: 0.4 },

  featuresSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  featuresSectionTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 18, color: MD3Colors.onSurface, marginBottom: Spacing.md },
  featureCard: { marginBottom: Spacing.sm },
  featureCardInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,219,231,0.08)', alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, paddingVertical: 4 },
  featureTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 14, color: MD3Colors.onSurface },
  featureDescription: { fontFamily: 'HankenGrotesk-Regular', fontSize: 12, color: MD3Colors.onSurfaceVariant, marginTop: 1 },
  spacer: { height: 24 },
});
