import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { MD3Colors } from '@/lib/theme';
import { Activity } from 'lucide-react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useI18n();

  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (loading || user) return;

    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading, user, router]);

  return (
    <View style={styles.container}>
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />

      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.iconCircle}>
          <Activity size={40} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
        </View>
        <Text style={styles.brandName}>MotorEcho</Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        {t.splash.tagline}
      </Animated.Text>

      <View style={styles.dotsRow}>
        <PulseDot delay={0} />
        <PulseDot delay={200} />
        <PulseDot delay={400} />
      </View>
    </View>
  );
}

function PulseDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
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
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(0,219,231,0.12)',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,219,231,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,219,231,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MD3Colors.primaryFixedDim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  brandName: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 36,
    color: MD3Colors.onSurface,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    color: MD3Colors.onSurfaceVariant,
    marginTop: 12,
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 48,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MD3Colors.primaryFixedDim,
  },
});
