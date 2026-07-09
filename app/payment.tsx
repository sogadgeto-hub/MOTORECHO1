import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '@/components/FadeInView';
import { ArrowLeft, Lock, CreditCard, CheckCircle, Shield, Crown, Building2 } from 'lucide-react-native';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

type BillingCycle = 'monthly' | 'yearly';

const PLAN_INFO = {
  premium: {
    name: 'Premium',
    monthlyPrice: '2.99',
    yearlyPrice: '29.99',
    yearlySaving: 'Save 17%',
    color: MD3Colors.primaryFixedDim,
    icon: Crown,
  },
  garage: {
    name: 'Garage Pro',
    monthlyPrice: '49',
    yearlyPrice: null,
    yearlySaving: null,
    color: MD3Colors.tertiaryFixedDim,
    icon: Building2,
  },
};

export default function PaymentScreen() {
  const router = useRouter();
  const { updatePlan } = useAuth();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ plan?: string }>();
  const plan = (params.plan ?? 'premium') as 'premium' | 'garage';
  const info = PLAN_INFO[plan] ?? PLAN_INFO.premium;

  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const successScale = useRef(new Animated.Value(0.5)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (success) {
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }),
        Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [success]);

  function formatCardNumber(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  }

  async function handlePay() {
    if (!name.trim()) return;
    setLoading(true);
    // Simulate payment processing (mock)
    await new Promise(r => setTimeout(r, 1800));
    const { error } = await updatePlan(plan);
    setLoading(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => router.replace('/vehicle-setup'), 2000);
    }
  }

  const price = billing === 'monthly' ? info.monthlyPrice : info.yearlyPrice ?? info.monthlyPrice;
  const period = billing === 'monthly' ? t.payment.perMonth : t.payment.perYear;

  if (success) {
    return (
      <View style={styles.successContainer}>
        <LinearGradient colors={['#06080F', MD3Colors.background]} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.successContent, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
          <View style={styles.successIcon}>
            <CheckCircle size={56} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
          </View>
          <Text style={styles.successTitle}>{t.payment.success.title}</Text>
          <Text style={styles.successSubtitle}>{t.payment.success.subtitle.replace('{{plan}}', info.name)}</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#06080F', MD3Colors.background, '#0A0A0E']} style={StyleSheet.absoluteFill} />
      <View style={styles.ambientTop} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={24} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
        </TouchableOpacity>

        <FadeInView delay={50} style={styles.header}>
          <View style={[styles.planBadge, { backgroundColor: `${info.color}12`, borderColor: `${info.color}30` }]}>
            <info.icon size={16} color={info.color} strokeWidth={2} />
            <Text style={[styles.planBadgeText, { color: info.color }]}>{info.name}</Text>
          </View>
          <Text style={styles.title}>{t.payment.title}</Text>
          <Text style={styles.subtitle}>{t.payment.subtitle}</Text>
        </FadeInView>

        {/* Billing Toggle — only for premium */}
        {plan === 'premium' && info.yearlyPrice && (
          <FadeInView delay={100} style={styles.billingToggle}>
            <TouchableOpacity
              style={[styles.billingOption, billing === 'monthly' && styles.billingOptionActive]}
              onPress={() => setBilling('monthly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.billingOptionText, billing === 'monthly' && styles.billingOptionTextActive]}>{t.payment.monthly}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.billingOption, billing === 'yearly' && styles.billingOptionActive]}
              onPress={() => setBilling('yearly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.billingOptionText, billing === 'yearly' && styles.billingOptionTextActive]}>{t.payment.yearly}</Text>
              <View style={styles.savingBadge}>
                <Text style={styles.savingText}>{t.payment.save17}</Text>
              </View>
            </TouchableOpacity>
          </FadeInView>
        )}

        {/* Price Summary */}
        <FadeInView delay={150} style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t.payment.total}</Text>
            <View style={styles.priceAmountRow}>
              <Text style={[styles.priceAmount, { color: info.color }]}>€{price}</Text>
              <Text style={styles.pricePeriod}>{period}</Text>
            </View>
          </View>
        </FadeInView>

        {/* Card Form */}
        <FadeInView delay={200} style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <CreditCard size={16} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
            <Text style={styles.sectionTitle}>{t.payment.paymentInfo}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.payment.cardholderName}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t.payment.cardholderNamePlaceholder}
              placeholderTextColor={MD3Colors.onSurfaceVariant}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.payment.cardNumber}</Text>
            <TextInput
              style={styles.input}
              value={cardNumber}
              onChangeText={(v) => setCardNumber(formatCardNumber(v))}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={MD3Colors.onSurfaceVariant}
              keyboardType="number-pad"
              maxLength={19}
            />
          </View>

          <View style={styles.cardBottomRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>{t.payment.expiry}</Text>
              <TextInput
                style={styles.input}
                value={expiry}
                onChangeText={(v) => setExpiry(formatExpiry(v))}
                placeholder="MM/YY"
                placeholderTextColor={MD3Colors.onSurfaceVariant}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>{t.payment.cvv}</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                placeholder="•••"
                placeholderTextColor={MD3Colors.onSurfaceVariant}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>
        </FadeInView>

        {/* Security Note */}
        <FadeInView delay={300} style={styles.securityNote}>
          <Shield size={14} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
          <Text style={styles.securityText}>
            {t.payment.securityNote}
          </Text>
        </FadeInView>

        {/* Demo Notice */}
        <FadeInView delay={350} style={styles.demoNotice}>
          <Text style={styles.demoText}>
            {t.payment.demoNotice}
          </Text>
        </FadeInView>

        <FadeInView delay={400}>
          <TouchableOpacity
            style={[styles.payButton, (!name.trim() || loading) && styles.payButtonDisabled]}
            onPress={handlePay}
            disabled={!name.trim() || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={plan === 'premium' ? [MD3Colors.primaryFixedDim, MD3Colors.primaryFixed] : [MD3Colors.tertiaryFixedDim, MD3Colors.tertiaryFixed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payGradient}
            >
              <Lock size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.payText}>
                {loading ? t.payment.processing : t.payment.subscribe.replace('{{price}}', price).replace('{{period}}', period)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </FadeInView>

        <FadeInView delay={450} style={styles.skipRow}>
          <TouchableOpacity onPress={() => router.replace('/vehicle-setup')} activeOpacity={0.7}>
            <Text style={styles.skipText}>{t.payment.skipForNow}</Text>
          </TouchableOpacity>
        </FadeInView>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ambientTop: {
    position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(0,219,231,0.05)',
  },
  scrollContent: { paddingTop: 60, paddingHorizontal: Spacing.lg, flexGrow: 1 },
  backButton: { padding: Spacing.sm, marginBottom: Spacing.lg, width: 44 },
  header: { marginBottom: 24 },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16,
  },
  planBadgeText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 13 },
  title: { fontFamily: 'HankenGrotesk-Bold', fontSize: 26, color: MD3Colors.onSurface, marginBottom: 6 },
  subtitle: { fontFamily: 'HankenGrotesk-Regular', fontSize: 14, color: MD3Colors.onSurfaceVariant },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: MD3Colors.surfaceContainer,
    borderRadius: Radii.md,
    padding: 4,
    marginBottom: 16,
  },
  billingOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: Radii.md - 2, gap: 6,
  },
  billingOptionActive: { backgroundColor: MD3Colors.primaryFixedDim },
  billingOptionText: { fontFamily: 'HankenGrotesk-Medium', fontSize: 14, color: MD3Colors.onSurfaceVariant },
  billingOptionTextActive: { color: MD3Colors.onPrimary },
  savingBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  savingText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 10, color: MD3Colors.onPrimary },
  priceSummary: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: Spacing.md,
    marginBottom: 20,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontFamily: 'HankenGrotesk-Regular', fontSize: 15, color: MD3Colors.onSurfaceVariant },
  priceAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  priceAmount: { fontFamily: 'HankenGrotesk-Bold', fontSize: 28 },
  pricePeriod: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant },
  formSection: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 15, color: MD3Colors.onSurface },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontFamily: 'HankenGrotesk-Medium', fontSize: 13, color: MD3Colors.onSurfaceVariant, marginBottom: Spacing.sm },
  input: {
    fontFamily: 'HankenGrotesk-Regular', fontSize: 15, color: MD3Colors.onSurface,
    backgroundColor: MD3Colors.surfaceContainer, borderRadius: Radii.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  cardBottomRow: { flexDirection: 'row' },
  securityNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: Radii.md,
    padding: 12, marginBottom: 12,
  },
  securityText: {
    flex: 1, fontFamily: 'HankenGrotesk-Regular', fontSize: 12,
    color: MD3Colors.onSurfaceVariant, lineHeight: 18,
  },
  demoNotice: {
    backgroundColor: 'rgba(232,196,35,0.06)', borderRadius: Radii.md,
    borderWidth: 1, borderColor: 'rgba(232,196,35,0.15)',
    padding: 10, marginBottom: 20,
  },
  demoText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 12, color: MD3Colors.tertiaryFixedDim, textAlign: 'center' },
  payButton: { borderRadius: Radii.md, overflow: 'hidden', marginBottom: 14 },
  payButtonDisabled: { opacity: 0.6 },
  payGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  payText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: '#FFFFFF' },
  skipRow: { alignItems: 'center' },
  skipText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant },
  successContent: { alignItems: 'center', paddingHorizontal: Spacing.lg },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(0,219,231,0.08)', borderWidth: 1, borderColor: 'rgba(0,219,231,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontFamily: 'HankenGrotesk-Bold', fontSize: 28, color: MD3Colors.onSurface, marginBottom: 8 },
  successSubtitle: { fontFamily: 'HankenGrotesk-Regular', fontSize: 15, color: MD3Colors.onSurfaceVariant, textAlign: 'center' },
  spacer: { height: 40 },
});
