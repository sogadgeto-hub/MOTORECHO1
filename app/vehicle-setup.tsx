import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '@/components/FadeInView';
import { BrandPicker } from '@/components/BrandPicker';
import { Car, ArrowLeft, ChevronDown } from 'lucide-react-native';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { validateVehiclePayload } from '@/lib/db';

const ENGINE_TYPES = ['1.0L Turbo', '1.2L', '1.4L Turbo', '1.5L', '1.6L', '2.0L', '2.0L TFSI', '2.5L', '3.0L V6', '3.0L Diesel', 'Inline-4', 'Inline-6', 'V6', 'V8', 'Electric Motor', 'Diesel Turbo'];

export default function VehicleSetupScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [brand, setBrand] = useState('');
  const [brandId, setBrandId] = useState<string | null>(null);
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [engineType, setEngineType] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFuelPicker, setShowFuelPicker] = useState(false);
  const [showEnginePicker, setShowEnginePicker] = useState(false);

  const fuelTypes = [
    { key: 'gasoline', label: t.vehicleSetup.fuelTypes.gasoline },
    { key: 'diesel', label: t.vehicleSetup.fuelTypes.diesel },
    { key: 'hybrid', label: t.vehicleSetup.fuelTypes.hybrid },
    { key: 'electric', label: t.vehicleSetup.fuelTypes.electric },
    { key: 'lpg', label: 'LPG' },
  ];

  async function handleSave() {
    const yearNum = parseInt(year, 10);
    const payload = {
      brand,
      brand_id: brandId,
      model,
      year: yearNum,
      fuel_type: fuelType,
      engine_type: engineType,
      nickname: licensePlate || null,
    };

    // Client-side validation before touching the DB
    const validationError = validateVehiclePayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      setError('No authenticated session — please log in again.');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('[vehicle-setup] submitting →', JSON.stringify(payload));

    try {
      const { error: vehicleError } = await supabase.from('vehicles').insert({
        user_id: user.id,
        ...payload,
        is_primary: true,
      });

      if (vehicleError) {
        const detail = vehicleError.details ? ` (${vehicleError.details})` : '';
        const hint = vehicleError.hint ? ` Hint: ${vehicleError.hint}` : '';
        const msg = `Vehicle creation failed: ${vehicleError.message}${detail}${hint}`;
        console.error('[vehicle-setup] DB error →', vehicleError);
        setError(msg);
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileError) {
        console.error('[vehicle-setup] profile update error →', profileError);
        // Non-fatal: vehicle was saved — still proceed
      }

      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[vehicle-setup] unexpected error →', msg);
      setError(`Vehicle creation failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#06080F', MD3Colors.background, '#0A0A0E']} style={StyleSheet.absoluteFill} />
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={24} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
        </TouchableOpacity>

        <FadeInView delay={100} style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Car size={36} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>{t.vehicleSetup.title}</Text>
          <Text style={styles.subtitle}>{t.vehicleSetup.subtitle}</Text>
        </FadeInView>

        <FadeInView delay={200} style={styles.form}>
          {/* Brand — DB-driven searchable picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.vehicleSetup.brand}</Text>
            <BrandPicker
              value={brand}
              brandId={brandId}
              onChange={(name, id) => { setBrand(name); setBrandId(id); }}
              placeholder={t.vehicleSetup.brandPlaceholder}
              label={t.vehicleSetup.brand}
            />
          </View>

          {/* Model */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.vehicleSetup.model}</Text>
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder={t.vehicleSetup.modelPlaceholder}
              placeholderTextColor={MD3Colors.onSurfaceVariant}
            />
          </View>

          {/* Year */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.vehicleSetup.year}</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              placeholder={t.vehicleSetup.yearPlaceholder}
              placeholderTextColor={MD3Colors.onSurfaceVariant}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          {/* Fuel Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.vehicleSetup.fuelType}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => { setShowFuelPicker(!showFuelPicker); setShowEnginePicker(false); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.pickerText, !fuelType && styles.pickerPlaceholder]}>
                {fuelType ? fuelTypes.find(f => f.key === fuelType)?.label : t.vehicleSetup.fuelType}
              </Text>
              <ChevronDown size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
            </TouchableOpacity>
            {showFuelPicker && (
              <View style={styles.pickerOptions}>
                {fuelTypes.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.pickerOption, fuelType === f.key && styles.pickerOptionSelected]}
                    onPress={() => { setFuelType(f.key); setShowFuelPicker(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerOptionText, fuelType === f.key && styles.pickerOptionTextSelected]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Engine Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.vehicleSetup.engineType}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => { setShowEnginePicker(!showEnginePicker); setShowFuelPicker(false); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.pickerText, !engineType && styles.pickerPlaceholder]}>
                {engineType || t.vehicleSetup.enginePlaceholder}
              </Text>
              <ChevronDown size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
            </TouchableOpacity>
            {showEnginePicker && (
              <View style={styles.pickerOptions}>
                {ENGINE_TYPES.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.pickerOption, engineType === e && styles.pickerOptionSelected]}
                    onPress={() => { setEngineType(e); setShowEnginePicker(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerOptionText, engineType === e && styles.pickerOptionTextSelected]}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* License Plate (optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {t.vehicleSetup.licensePlate} <Text style={styles.optionalLabel}>({t.common.optional})</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={licensePlate}
              onChangeText={setLicensePlate}
              placeholder={t.vehicleSetup.licensePlatePlaceholder}
              placeholderTextColor={MD3Colors.onSurfaceVariant}
              autoCapitalize="characters"
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>{loading ? t.vehicleSetup.saving : t.common.continue}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </FadeInView>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientTop: {
    position: 'absolute', top: -120, right: -60, width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(0, 166, 251, 0.06)',
  },
  ambientBottom: {
    position: 'absolute', bottom: -80, left: -80, width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(0, 166, 251, 0.04)',
  },
  scrollContent: { paddingTop: 60, paddingHorizontal: Spacing.lg, flexGrow: 1 },
  backButton: { padding: Spacing.sm, marginBottom: Spacing.lg, width: 44 },
  headerSection: { alignItems: 'center', marginBottom: Spacing.xxl },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0,219,231,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'HankenGrotesk-Bold', fontSize: 28, color: MD3Colors.onSurface,
    marginBottom: Spacing.xs, textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'HankenGrotesk-Regular', fontSize: 15, color: MD3Colors.onSurfaceVariant,
    textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.lg,
  },
  form: { marginBottom: Spacing.xl },
  inputGroup: { marginBottom: Spacing.lg },
  inputLabel: { fontFamily: 'HankenGrotesk-Medium', fontSize: 13, color: MD3Colors.onSurfaceVariant, marginBottom: Spacing.sm },
  optionalLabel: { fontFamily: 'HankenGrotesk-Regular', fontSize: 12, color: MD3Colors.onSurfaceVariant },
  input: {
    fontFamily: 'HankenGrotesk-Regular', fontSize: 16, color: MD3Colors.onSurface,
    backgroundColor: MD3Colors.surfaceContainer, borderRadius: Radii.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: 14, paddingHorizontal: 16,
  },
  pickerButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: MD3Colors.surfaceContainer, borderRadius: Radii.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: 14, paddingHorizontal: 16,
  },
  pickerText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 16, color: MD3Colors.onSurface },
  pickerPlaceholder: { color: MD3Colors.onSurfaceVariant },
  pickerOptions: {
    marginTop: Spacing.sm, backgroundColor: MD3Colors.surfaceContainer, borderRadius: Radii.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', maxHeight: 220,
  },
  pickerOption: {
    paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pickerOptionSelected: { backgroundColor: 'rgba(0,219,231,0.08)' },
  pickerOptionText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 15, color: MD3Colors.onSurface },
  pickerOptionTextSelected: { color: MD3Colors.primaryFixedDim, fontFamily: 'HankenGrotesk-SemiBold' },
  errorBox: {
    backgroundColor: 'rgba(255,180,171,0.08)', borderRadius: Radii.md,
    borderWidth: 1, borderColor: MD3Colors.error, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  errorText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 14, color: MD3Colors.error, textAlign: 'center' },
  submitButton: { borderRadius: Radii.md, overflow: 'hidden', marginTop: Spacing.md },
  submitGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: '#FFFFFF' },
  spacer: { height: 40 },
});
