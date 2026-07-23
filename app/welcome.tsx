import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity } from 'lucide-react-native';
import { FadeInView } from '@/components/FadeInView';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#06080F', MD3Colors.background, '#080E10']} style={StyleSheet.absoluteFill} />
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <View style={styles.content}>
        <FadeInView delay={0} style={styles.hero}>
          <View style={styles.iconCircle}>
            <Activity size={36} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
          </View>
          <Text style={styles.brandName}>MotorEcho</Text>
          <Text style={styles.tagline}>{t.splash.tagline}</Text>
        </FadeInView>

        <FadeInView delay={120} style={styles.actions}>
          <Text style={styles.sectionLabel}>{t.welcome.returningUser}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryButtonText}>{t.welcome.signInButton}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>{t.welcome.firstTimeUser}</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>{t.welcome.createAccountButton}</Text>
          </TouchableOpacity>
        </FadeInView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3Colors.background,
  },
  ambientTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(0,219,231,0.05)',
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0,166,251,0.04)',
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0,219,231,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,219,231,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandName: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 34,
    color: MD3Colors.onSurface,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    color: MD3Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  actions: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  primaryButton: {
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  primaryGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  divider: {
    height: 24,
  },
  secondaryButton: {
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: MD3Colors.onSurface,
  },
});
