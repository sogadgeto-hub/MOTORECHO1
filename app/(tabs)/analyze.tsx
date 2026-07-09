import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Car, Shield, Volume2, VolumeX, User } from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { GlassCard } from '@/components/GlassCard';
import { FadeInView } from '@/components/FadeInView';
import { MD3Colors, Spacing } from '@/lib/theme';
import { useState, useEffect } from 'react';
import { getPrimaryVehicle } from '@/lib/db';
import { Vehicle } from '@/lib/db';
import { useI18n } from '@/lib/i18n';

export default function AnalyzeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    getPrimaryVehicle().then(setVehicle).catch(() => {});
  }, []);

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
              <Mic size={24} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t.analyze.title}</Text>
          </View>
        </View>

        <FadeInView delay={100}>
          <TouchableOpacity style={styles.micButton} onPress={() => router.push('/recording')} activeOpacity={0.85}>
            <LinearGradient colors={[MD3Colors.primaryFixedDim, '#004f54']} style={styles.micGradient}>
              <View style={styles.micPulse}>
                <Mic size={56} color={MD3Colors.onPrimary} strokeWidth={1.5} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.micLabel}>{t.analyze.tapToRecord}</Text>
          <Text style={styles.micSubtext}>{t.analyze.duration}</Text>
        </FadeInView>

        <FadeInView delay={200} style={styles.sectionHeader}>
          <Shield size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
          <Text style={styles.sectionTitle}>{t.analyze.preparation}</Text>
        </FadeInView>

        <FadeInView delay={300} style={styles.stepsContainer}>
          <StepCard icon={Car} title={t.analyze.step1Title} description={t.analyze.step1Desc} />
          <StepCard icon={Volume2} title={t.analyze.step2Title} description={t.analyze.step2Desc} />
          <StepCard icon={VolumeX} title={t.analyze.step3Title} description={t.analyze.step3Desc} />
          <StepCard icon={User} title={t.analyze.step4Title} description={t.analyze.step4Desc} />
        </FadeInView>

        {vehicle && (
          <FadeInView delay={500} style={styles.vehicleSection}>
            <Text style={styles.sectionTitle}>{t.analyze.vehicle}</Text>
            <GlassCard>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleBrand}>{vehicle.brand} {vehicle.model}</Text>
                <Text style={styles.vehicleDetail}>{vehicle.year} · {vehicle.fuel_type} · {vehicle.engine_type}</Text>
              </View>
            </GlassCard>
          </FadeInView>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </AppBackground>
  );
}

function StepCard({ icon: Icon, title, description }: { icon: typeof Mic; title: string; description: string }) {
  return (
    <View style={styles.stepCard}>
      <GlassCard style={styles.stepCardInner}>
        <View style={styles.stepIcon}>
          <Icon size={20} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
        </View>
        <View style={styles.stepText}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.stepDescription}>{description}</Text>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 0, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMobile,
    height: 64,
    backgroundColor: 'rgba(13,21,21,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    padding: 8,
    borderRadius: 999,
  },
  headerTitle: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 24,
    lineHeight: 28,
    color: MD3Colors.primaryFixedDim,
    letterSpacing: -0.02,
    textShadowColor: 'rgba(0,219,231,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  micButton: { alignSelf: 'center', marginBottom: 12, marginTop: 32, borderRadius: 80, overflow: 'hidden' },
  micGradient: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  micPulse: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  micLabel: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 18, color: MD3Colors.onSurface, textAlign: 'center', marginBottom: 4, marginTop: 16 },
  micSubtext: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.containerMobile, marginBottom: 12, marginTop: 24 },
  sectionTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: MD3Colors.onSurface },
  stepsContainer: { paddingHorizontal: Spacing.containerMobile, gap: 8 },
  stepCard: {},
  stepCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,219,231,0.08)', alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1 },
  stepTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 14, color: MD3Colors.onSurface },
  stepDescription: { fontFamily: 'HankenGrotesk-Regular', fontSize: 12, color: MD3Colors.onSurfaceVariant, marginTop: 1 },
  vehicleSection: { paddingHorizontal: Spacing.containerMobile, marginTop: 24 },
  vehicleInfo: { padding: 4 },
  vehicleBrand: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: MD3Colors.onSurface },
  vehicleDetail: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant, marginTop: 2 },
  spacer: { height: 24 },
});
