import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '@/components/FadeInView';
import { Activity, Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      setError(t.common.error);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await resetPassword(email.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

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
              <Activity size={32} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
              <Text style={styles.brand}>MotorEcho</Text>
            </View>
            <Text style={styles.title}>{sent ? t.auth.forgotPassword.checkEmail : t.auth.forgotPassword.title}</Text>
            <Text style={styles.subtitle}>
              {sent ? t.auth.forgotPassword.emailSent : t.auth.forgotPassword.subtitle}
            </Text>
          </FadeInView>

          {!sent ? (
            <FadeInView delay={200} style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.auth.signIn.email}</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: 44 }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={MD3Colors.onSurfaceVariant}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.submitButton} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
                <LinearGradient
                  colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitText}>{loading ? t.common.loading : t.auth.forgotPassword.sendResetLink}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </FadeInView>
          ) : (
            <FadeInView delay={200} style={styles.successBox}>
              <View style={styles.successIcon}>
                <CheckCircle size={48} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
              </View>
              <TouchableOpacity style={styles.backToSignInButton} onPress={() => router.push('/auth')} activeOpacity={0.85}>
                <LinearGradient
                  colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitText}>{t.auth.forgotPassword.backToSignIn}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </FadeInView>
          )}

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
    width: 44,
  },
  headerSection: {
    marginBottom: Spacing.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  brand: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 22,
    color: MD3Colors.onSurface,
  },
  title: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 32,
    color: MD3Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    color: MD3Colors.onSurfaceVariant,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 16,
    color: MD3Colors.onSurface,
    backgroundColor: MD3Colors.surfaceContainer,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(255,180,171,0.08)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: MD3Colors.error,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.error,
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  backToSignInButton: {
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  successBox: {
    alignItems: 'center',
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,219,231,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  spacer: { height: 40 },
});
