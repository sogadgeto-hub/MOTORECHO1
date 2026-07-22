import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic } from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { GlassCard } from '@/components/GlassCard';
import { FadeInView } from '@/components/FadeInView';
import { PressableScale } from '@/components/PressableScale';
import { Animation, Colors, IconStroke, MD3Colors, Palette, Spacing, TouchTarget } from '@/lib/theme';
import { getPrimaryVehicle, Vehicle } from '@/lib/db';
import { useI18n } from '@/lib/i18n';

export default function AnalyzeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getPrimaryVehicle().then(setVehicle).catch(() => setVehicle(null));
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: Animation.slow * 4, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: Animation.slow * 4, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  function handleAnalyzePress() {
    if (!vehicle) {
      Alert.alert(t.recording.noVehicle, undefined, [
        { text: t.recording.goBack, style: 'cancel' },
        { text: t.recording.addVehicle, onPress: () => router.push('/add-vehicle') },
      ]);
      return;
    }
    router.push('/recording');
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.analyze.title}</Text>
        </View>

        <FadeInView delay={100}>
          <PressableScale
            style={styles.micButton}
            onPress={handleAnalyzePress}
            haptic
            accessibilityRole="button"
            accessibilityLabel={t.analyze.primaryAction}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LinearGradient colors={[MD3Colors.primaryFixedDim, Colors.primaryDark]} style={styles.micGradient}>
                <View style={styles.micPulse}>
                  <Mic size={56} color={Palette.onPrimary} strokeWidth={IconStroke.thin} />
                </View>
              </LinearGradient>
            </Animated.View>
          </PressableScale>
          <Text style={styles.micLabel}>{t.analyze.primaryAction}</Text>
          <Text style={styles.micSubtext}>{t.analyze.shortHint}</Text>
        </FadeInView>

        {vehicle ? (
          <FadeInView delay={200} style={styles.vehicleSection}>
            <Text style={styles.sectionTitle}>{t.analyze.vehicle}</Text>
            <GlassCard padded>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleBrand}>
                  {vehicle.brand} {vehicle.model}
                </Text>
                <Text style={styles.vehicleDetail}>
                  {vehicle.year} · {vehicle.fuel_type} · {vehicle.engine_type}
                </Text>
              </View>
            </GlassCard>
          </FadeInView>
        ) : (
          <FadeInView delay={200}>
            <GlassCard style={styles.noVehicleCard} padded>
              <Text style={styles.noVehicleText}>{t.recording.noVehicle}</Text>
              <TouchableOpacity
                style={styles.addVehicleBtn}
                onPress={() => router.push('/add-vehicle')}
                accessibilityRole="button"
                accessibilityLabel={t.recording.addVehicle}
              >
                <Text style={styles.addVehicleBtnText}>{t.recording.addVehicle}</Text>
              </TouchableOpacity>
            </GlassCard>
          </FadeInView>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 56, paddingBottom: 100, paddingHorizontal: Spacing.containerMobile },
  header: { marginBottom: Spacing.lg },
  headerTitle: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 24,
    lineHeight: 28,
    color: MD3Colors.onSurface,
  },
  micButton: { alignSelf: 'center', marginBottom: 12, borderRadius: 80, overflow: 'hidden' },
  micGradient: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  micPulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  micLabel: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 18,
    color: MD3Colors.onSurface,
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 16,
  },
  micSubtext: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: MD3Colors.onSurface, marginBottom: 12 },
  vehicleSection: { marginTop: Spacing.md },
  vehicleInfo: { gap: 4 },
  vehicleBrand: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: MD3Colors.onSurface },
  vehicleDetail: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant },
  noVehicleCard: { marginTop: Spacing.md, gap: Spacing.md },
  noVehicleText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 14, color: MD3Colors.onSurfaceVariant, lineHeight: 20 },
  addVehicleBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  addVehicleBtnText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 14, color: Palette.onPrimary },
  spacer: { height: 40 },
});
