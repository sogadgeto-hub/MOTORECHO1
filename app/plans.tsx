import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '@/components/FadeInView';
import { Check, Crown, Star, Building2, Activity } from 'lucide-react-native';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { resolveRouteAfterPlanSelection } from '@/lib/onboarding-flow';

type PlanKey = 'free' | 'premium' | 'garage';

export default function PlansScreen() {
  const router = useRouter();
  const { user, updatePlan } = useAuth();
  const { t } = useI18n();
  const [selected, setSelected] = useState<PlanKey>('free');
  const [loading, setLoading] = useState(false);

  const PLANS: Array<{
    key: PlanKey;
    name: string;
    price: string | null;
    priceYear?: string;
    period: string | null;
    badge?: string;
    features: string[];
    icon: typeof Crown;
    color: string;
    borderColor: string;
  }> = [
    {
      key: 'free',
      name: t.plans.starter.name,
      price: null,
      period: null,
      features: t.plans.starter.features as unknown as string[],
      icon: Activity,
      color: MD3Colors.onSurfaceVariant,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    {
      key: 'premium',
      name: t.plans.premium.name,
      price: '€2.99',
      priceYear: '€29.99',
      period: t.plans.perMonth,
      badge: t.plans.mostPopular,
      features: t.plans.premium.features as unknown as string[],
      icon: Crown,
      color: MD3Colors.primaryFixedDim,
      borderColor: MD3Colors.primaryFixedDim,
    },
    {
      key: 'garage',
      name: t.plans.garagePro.name,
      price: '€49',
      period: t.plans.perMonth,
      features: t.plans.garagePro.features as unknown as string[],
      icon: Building2,
      color: MD3Colors.tertiaryFixedDim,
      borderColor: MD3Colors.tertiaryFixedDim,
    },
  ];

  const BUTTON_LABELS: Record<PlanKey, string> = {
    free: t.plans.buttons.free,
    premium: t.plans.buttons.premium,
    garage: t.plans.buttons.garage,
  };

  async function handleContinue(planKey: PlanKey) {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await updatePlan(planKey);
      if (error) return;

      const nextRoute = resolveRouteAfterPlanSelection(planKey);
      if (nextRoute === 'payment') {
        router.replace({ pathname: '/payment', params: { plan: planKey } });
      } else {
        router.replace('/vehicle-setup');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#06080F', MD3Colors.background, '#080E10']} style={StyleSheet.absoluteFill} />
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInView delay={0} style={styles.header}>
          <View style={styles.logoRow}>
            <Activity size={22} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
            <Text style={styles.logoText}>MotorEcho</Text>
          </View>
          <Text style={styles.title}>{t.plans.title}</Text>
          <Text style={styles.subtitle}>{t.plans.subtitle}</Text>
        </FadeInView>

        {PLANS.map((p, i) => (
          <FadeInView key={p.key} delay={100 + i * 80}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelected(p.key)}
            >
              <View style={[
                styles.planCard,
                { borderColor: selected === p.key ? p.borderColor : 'rgba(255,255,255,0.07)' },
                selected === p.key && styles.planCardSelected,
                p.key === 'premium' && selected !== 'premium' && styles.planCardHighlight,
              ]}>
                {p.badge && (
                  <View style={styles.badge}>
                    <Star size={10} color={MD3Colors.primaryFixedDim} strokeWidth={2} fill={MD3Colors.primaryFixedDim} />
                    <Text style={styles.badgeText}>{p.badge}</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: `${p.color}15` }]}>
                    <p.icon size={20} color={p.color} strokeWidth={2} />
                  </View>
                  <View style={styles.planTitleBlock}>
                    <Text style={styles.planName}>{p.name}</Text>
                    {p.price ? (
                      <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: p.color }]}>{p.price}</Text>
                        <Text style={styles.period}>{p.period}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.priceFree, { color: p.color }]}>{t.plans.free}</Text>
                    )}
                  </View>
                  <View style={[styles.radio, selected === p.key && { borderColor: p.color, backgroundColor: `${p.color}20` }]}>
                    {selected === p.key && <View style={[styles.radioInner, { backgroundColor: p.color }]} />}
                  </View>
                </View>

                {p.key === 'premium' && p.priceYear && (
                  <View style={styles.yearlyPill}>
                    <Text style={styles.yearlyText}>{t.plans.yearlyOption}</Text>
                  </View>
                )}

                <View style={styles.featuresList}>
                  {p.features.map((f, fi) => (
                    <View key={fi} style={styles.featureRow}>
                      <View style={[styles.checkCircle, { backgroundColor: `${p.color}20` }]}>
                        <Check size={10} color={p.color} strokeWidth={3} />
                      </View>
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.planButton, { borderColor: p.color }]}
                  onPress={() => { setSelected(p.key); void handleContinue(p.key); }}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {p.key === 'premium' ? (
                    <LinearGradient
                      colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.planButtonGradient}
                    >
                      <Text style={styles.planButtonTextPrimary}>{BUTTON_LABELS[p.key]}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.planButtonPlain, { backgroundColor: `${p.color}12` }]}>
                      <Text style={[styles.planButtonText, { color: p.color }]}>{BUTTON_LABELS[p.key]}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </FadeInView>
        ))}

        <FadeInView delay={500}>
          <Text style={styles.footNote}>{t.plans.changePlanAnytime}</Text>
        </FadeInView>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientTop: {
    position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(0,219,231,0.05)',
  },
  ambientBottom: {
    position: 'absolute', bottom: -80, left: -80, width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(0,166,251,0.04)',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoText: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 18,
    color: MD3Colors.onSurface,
  },
  title: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 26,
    color: MD3Colors.onSurface,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    color: MD3Colors.onSurfaceVariant,
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    padding: Spacing.lg,
    marginBottom: 16,
    position: 'relative',
    overflow: 'visible',
  },
  planCardSelected: {
    backgroundColor: 'rgba(0,219,231,0.03)',
  },
  planCardHighlight: {
    borderColor: 'rgba(0,219,231,0.2)',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MD3Colors.primaryFixedDim,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  badgeText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 10,
    color: MD3Colors.onPrimary,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitleBlock: {
    flex: 1,
  },
  planName: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 18,
    color: MD3Colors.onSurface,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  price: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 22,
  },
  priceFree: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 22,
    marginTop: 2,
  },
  period: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  yearlyPill: {
    backgroundColor: 'rgba(0,219,231,0.06)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  yearlyText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 11,
    color: MD3Colors.primaryFixedDim,
  },
  featuresList: {
    gap: 8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
  },
  planButton: {
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  planButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planButtonPlain: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md - 1,
  },
  planButtonTextPrimary: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  planButtonText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
  },
  footNote: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  signInText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
  },
  signInLink: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
  },
  spacer: { height: 20 },
});
