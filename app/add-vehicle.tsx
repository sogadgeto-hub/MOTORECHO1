import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '@/components/FadeInView';
import { BrandPicker } from '@/components/BrandPicker';
import { ArrowLeft, Car, Fuel, Calendar, Gauge } from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { MD3Colors, Colors, Spacing, Radii } from '@/lib/theme';
import { createVehicle, getVehicleValidationMessage, validateVehiclePayload } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { resolvePlanLimitMessage } from '@/lib/plan-access';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { UpgradeModal } from '@/components/UpgradeModal';

const FUEL_OPTIONS = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Plugin Hybrid'];

export default function AddVehicleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plan, verifyAddVehicle, refreshUsage } = useSubscriptionAccess(user?.id);
  const { t } = useI18n();
  const [brand, setBrand] = useState('');
  const [brandId, setBrandId] = useState<string | null>(null);
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [fuelType, setFuelType] = useState('Gasoline');
  const [engineType, setEngineType] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [upgradeTarget, setUpgradeTarget] = useState<'premium' | 'garage'>('premium');

  const canSave = !!brandId && model.trim().length > 0 && year.trim().length === 4 && engineType.trim().length > 0;

  async function handleSave() {
    const payload = {
      brand: brand.trim(),
      brand_id: brandId,
      model: model.trim(),
      year: parseInt(year.trim(), 10),
      fuel_type: fuelType,
      engine_type: engineType.trim(),
      nickname: null as string | null,
    };

    // Client-side validation before touching the DB
    const validationCode = validateVehiclePayload(payload);
    if (validationCode) {
      setError(getVehicleValidationMessage(validationCode));
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const limit = await verifyAddVehicle();
      if (!limit.allowed) {
        setUpgradeTarget(limit.upgradeTo === 'garage' ? 'garage' : 'premium');
        setUpgradeReason(resolvePlanLimitMessage('add_vehicle', limit.upgradeTo, t.limits));
        setShowUpgradeModal(true);
        return;
      }

      await createVehicle(payload);
      await refreshUsage('after_vehicle');
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={24} color={Colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t.garage.addVehicle}</Text>
            <Text style={styles.headerSubtitle}>{t.vehicleSetup.subtitle}</Text>
          </View>

          <FadeInView delay={100} style={styles.form}>
            {/* Brand — DB-driven searchable picker */}
            <FadeInView delay={100} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.vehicleSetup.brand}</Text>
              <BrandPicker
                value={brand}
                brandId={brandId}
                onChange={(name, id) => { setBrand(name); setBrandId(id); }}
                placeholder={t.vehicleSetup.brandPlaceholder}
                label={t.vehicleSetup.brand}
              />
            </FadeInView>

            <FadeInView delay={200} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.vehicleSetup.model}</Text>
              <View style={styles.inputRow}>
                <Car size={18} color={Colors.textMuted} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t.vehicleSetup.modelPlaceholder}
                  placeholderTextColor={Colors.textDisabled}
                  value={model}
                  onChangeText={setModel}
                  autoCapitalize="words"
                />
              </View>
            </FadeInView>

            <FadeInView delay={300} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.vehicleSetup.year}</Text>
              <View style={styles.inputRow}>
                <Calendar size={18} color={Colors.textMuted} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t.vehicleSetup.yearPlaceholder}
                  placeholderTextColor={Colors.textDisabled}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </FadeInView>

            <FadeInView delay={400} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.vehicleSetup.fuelType}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fuelScroll}>
                {FUEL_OPTIONS.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.fuelChip, fuelType === f && styles.fuelChipActive]}
                    onPress={() => setFuelType(f)}
                    activeOpacity={0.7}
                  >
                    <Fuel size={14} color={fuelType === f ? '#FFFFFF' : Colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.fuelChipText, fuelType === f && styles.fuelChipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </FadeInView>

            <FadeInView delay={500} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.vehicleSetup.engineType}</Text>
              <View style={styles.inputRow}>
                <Gauge size={18} color={Colors.textMuted} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t.vehicleSetup.enginePlaceholder}
                  placeholderTextColor={Colors.textDisabled}
                  value={engineType}
                  onChangeText={setEngineType}
                  autoCapitalize="words"
                />
              </View>
            </FadeInView>
          </FadeInView>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <FadeInView delay={600} style={styles.buttonWrap}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={!canSave || saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={canSave ? [Colors.primary, Colors.primaryDark] : [Colors.textDisabled, Colors.textDisabled]}
                style={styles.saveGradient}
              >
                <Text style={styles.saveText}>
                  {saving ? t.vehicleSetup.saving : t.vehicleSetup.save}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </FadeInView>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => router.back()}
        currentPlan={plan}
        upgradeTo={upgradeTarget}
        reason={upgradeReason}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          router.push('/premium');
        }}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 16, color: MD3Colors.onSurfaceVariant },
  scrollContent: { paddingTop: 56, paddingBottom: 40 },
  backButton: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  header: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  headerTitle: { fontFamily: 'HankenGrotesk-Bold', fontSize: 28, color: Colors.text },
  headerSubtitle: { fontFamily: 'HankenGrotesk-Regular', fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  form: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  fieldGroup: {},
  fieldLabel: { fontFamily: 'HankenGrotesk-Medium', fontSize: 12, color: Colors.textSecondary, marginBottom: 6, letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontFamily: 'HankenGrotesk-Regular', fontSize: 15, color: Colors.text, paddingVertical: 14 },
  fuelScroll: { marginBottom: 4 },
  fuelChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.surfaceElevated },
  fuelChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  fuelChipText: { fontFamily: 'HankenGrotesk-Medium', fontSize: 13, color: Colors.textSecondary },
  fuelChipTextActive: { color: '#FFFFFF' },
  errorBox: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, padding: Spacing.md, backgroundColor: Colors.dangerBg, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.danger },
  errorText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 14, color: Colors.danger, textAlign: 'center' },
  buttonWrap: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  saveButton: { borderRadius: Radii.md, overflow: 'hidden' },
  saveGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: '#FFFFFF' },
  spacer: { height: 24 },
});
