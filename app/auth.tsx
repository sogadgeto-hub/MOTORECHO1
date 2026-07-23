import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '@/components/FadeInView';
import { Activity, Mail, Lock, Eye, EyeOff, ArrowLeft, User, CheckSquare, Square } from 'lucide-react-native';
import { MD3Colors, Colors, Spacing, Radii } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ mode?: string }>();

  const initialMode = params.mode === 'signup' ? 'signup' : 'signin';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [allowAiTraining, setAllowAiTraining] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError(t.common.error);
      return;
    }

    if (mode === 'signup') {
      if (!firstName.trim() || !lastName.trim()) {
        setError(t.auth.signUp.firstName + ' and ' + t.auth.signUp.lastName + ' are required');
        return;
      }
      if (password.length < 6) {
        setError(t.auth.signUp.passwordMinLength);
        return;
      }
      if (password !== confirmPassword) {
        setError(t.auth.signUp.passwordsNoMatch);
        return;
      }
      if (!acceptTerms || !acceptPrivacy) {
        setError(t.auth.signUp.acceptRequired);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const result = await signIn(email.trim(), password);
        if (result.error) {
          setError(result.error);
        }
      } else {
        const result = await signUp(email.trim(), password, firstName.trim(), lastName.trim());
        if (result.error) {
          setError(result.error);
        } else {
          // Update plan and AI training consent after signup
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from('profiles').update({
              allow_ai_training: allowAiTraining,
            }).eq('id', session.user.id);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const isSignUp = mode === 'signup';
  const title = isSignUp ? t.auth.signUp.title : t.auth.signIn.title;
  const subtitle = isSignUp ? t.auth.signUp.subtitle : t.auth.signIn.subtitle;
  const buttonText = isSignUp ? t.auth.signUp.createAccount : t.auth.signIn.signInButton;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#06080F', MD3Colors.background, '#0A0A0E']} style={StyleSheet.absoluteFill} />
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={24} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
          </TouchableOpacity>

          <FadeInView delay={100} style={styles.headerSection}>
            <View style={styles.brandRow}>
              <Activity size={28} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
              <Text style={styles.brand}>MotorEcho</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </FadeInView>

          <FadeInView delay={200} style={styles.form}>
            {isSignUp && (
              <View style={styles.nameRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{t.auth.signUp.firstName}</Text>
                  <View style={styles.inputWrapper}>
                    <User size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { paddingLeft: 40 }]}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="John"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <View style={{ width: 12 }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{t.auth.signUp.lastName}</Text>
                  <View style={styles.inputWrapper}>
                    <User size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { paddingLeft: 40 }]}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Doe"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{isSignUp ? t.auth.signUp.email : t.auth.signIn.email}</Text>
              <View style={styles.inputWrapper}>
                <Mail size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 40 }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{isSignUp ? t.auth.signUp.password : t.auth.signIn.password}</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 40, paddingRight: 44 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                  {showPassword ? <EyeOff size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} /> : <Eye size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />}
                </TouchableOpacity>
              </View>
            </View>

            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.auth.signUp.confirmPassword}</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 40, paddingRight: 44 }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)} activeOpacity={0.7}>
                    {showConfirmPassword ? <EyeOff size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} /> : <Eye size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isSignUp && (
              <View style={styles.checkboxSection}>
                <CheckboxRow
                  checked={acceptTerms}
                  onToggle={() => setAcceptTerms(!acceptTerms)}
                  label={t.auth.signUp.acceptTerms}
                  required
                />
                <CheckboxRow
                  checked={acceptPrivacy}
                  onToggle={() => setAcceptPrivacy(!acceptPrivacy)}
                  label={t.auth.signUp.acceptPrivacy}
                  required
                />
                <CheckboxRow
                  checked={allowAiTraining}
                  onToggle={() => setAllowAiTraining(!allowAiTraining)}
                  label={t.auth.signUp.allowAiTraining}
                  muted
                />
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!isSignUp && (
              <TouchableOpacity style={styles.forgotButton} onPress={() => router.push('/forgot-password')} activeOpacity={0.7}>
                <Text style={styles.forgotText}>{t.auth.signIn.forgotPassword}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>{loading ? t.common.loading : buttonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </FadeInView>

          <FadeInView delay={300} style={styles.switchMode}>
            <Text style={styles.switchModeText}>
              {isSignUp ? t.auth.signUp.alreadyHaveAccount : t.auth.signIn.noAccount}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} activeOpacity={0.7}>
              <Text style={styles.switchModeLink}>
                {isSignUp ? t.auth.signUp.signIn : t.auth.signIn.signUp}
              </Text>
            </TouchableOpacity>
          </FadeInView>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function CheckboxRow({ checked, onToggle, label, required, muted }: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  required?: boolean;
  muted?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.checkboxIcon}>
        {checked
          ? <CheckSquare size={20} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
          : <Square size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
        }
      </View>
      <Text style={[styles.checkboxLabel, muted && styles.checkboxLabelMuted]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientTop: {
    position: 'absolute', top: -120, right: -60, width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(0,166,251,0.06)',
  },
  ambientBottom: {
    position: 'absolute', bottom: -80, left: -80, width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(0,166,251,0.04)',
  },
  scrollContent: { paddingTop: 60, paddingHorizontal: Spacing.lg, flexGrow: 1 },
  backButton: { padding: Spacing.sm, marginBottom: Spacing.lg, width: 44 },
  headerSection: { marginBottom: Spacing.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.lg },
  brand: { fontFamily: 'HankenGrotesk-Bold', fontSize: 20, color: MD3Colors.onSurface },
  title: { fontFamily: 'HankenGrotesk-Bold', fontSize: 30, color: MD3Colors.onSurface, marginBottom: Spacing.xs },
  subtitle: { fontFamily: 'HankenGrotesk-Regular', fontSize: 15, color: MD3Colors.onSurfaceVariant, marginBottom: 12 },
  planPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,219,231,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,219,231,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  planPillText: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 12,
    color: MD3Colors.primaryFixedDim,
  },
  form: { marginBottom: Spacing.xl },
  nameRow: { flexDirection: 'row' },
  inputGroup: { marginBottom: Spacing.lg },
  inputLabel: { fontFamily: 'HankenGrotesk-Medium', fontSize: 13, color: MD3Colors.onSurfaceVariant, marginBottom: Spacing.sm },
  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, zIndex: 1 },
  eyeButton: { position: 'absolute', right: 14, zIndex: 1, padding: 4 },
  input: {
    flex: 1,
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    color: MD3Colors.onSurface,
    backgroundColor: MD3Colors.surfaceContainer,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  checkboxSection: {
    gap: 12,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkboxIcon: { marginTop: 1 },
  checkboxLabel: {
    flex: 1,
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurface,
    lineHeight: 18,
  },
  checkboxLabelMuted: { color: MD3Colors.onSurfaceVariant },
  required: { color: MD3Colors.error },
  errorBox: {
    backgroundColor: 'rgba(255,180,171,0.08)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: MD3Colors.error,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 14, color: MD3Colors.error, textAlign: 'center' },
  forgotButton: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
  forgotText: { fontFamily: 'HankenGrotesk-Medium', fontSize: 14, color: MD3Colors.primaryFixedDim },
  submitButton: { borderRadius: Radii.md, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: '#FFFFFF' },
  switchMode: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xs },
  switchModeText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 14, color: MD3Colors.onSurfaceVariant },
  switchModeLink: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 14, color: MD3Colors.primaryFixedDim },
  spacer: { height: 40 },
});
