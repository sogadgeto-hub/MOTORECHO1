import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Radio, Shield, Zap } from 'lucide-react-native';
import { FadeInView } from '@/components/FadeInView';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value((1 / 3) * 100)).current;

  const slides = [
    { icon: Radio, title: t.onboarding.slide1.title, subtitle: t.onboarding.slide1.subtitle, color: MD3Colors.primaryFixedDim },
    { icon: Zap, title: t.onboarding.slide2.title, subtitle: t.onboarding.slide2.subtitle, color: MD3Colors.tertiaryFixedDim },
    { icon: Shield, title: t.onboarding.slide3.title, subtitle: t.onboarding.slide3.subtitle, color: MD3Colors.primaryFixedDim },
  ];

  function goToSlide(i: number) {
    setIndex(i);
    flatListRef.current?.scrollToIndex({ index: i, animated: true });
    Animated.spring(progressAnim, {
      toValue: ((i + 1) / slides.length) * 100,
      useNativeDriver: false,
    }).start();
  }

  function handleNext() {
    if (index < slides.length - 1) {
      goToSlide(index + 1);
    } else {
      finishOnboarding();
    }
  }

  async function finishOnboarding() {
    router.replace('/(tabs)');
  }

  function renderSlide({ item }: { item: typeof slides[0] }) {
    const Icon = item.icon;
    return (
      <View style={styles.slide}>
        <FadeInView delay={200} style={styles.iconContainer}>
          <View style={[styles.iconBg, { backgroundColor: `${item.color}15` }]}>
            <Icon size={48} color={item.color} strokeWidth={1.5} />
          </View>
        </FadeInView>
        <FadeInView delay={400}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </FadeInView>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#06080F', MD3Colors.background, '#0A0A0E']} style={StyleSheet.absoluteFill} />
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Activity size={20} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
          <Text style={styles.brand}>MotorEcho</Text>
        </View>
        <TouchableOpacity onPress={finishOnboarding} activeOpacity={0.7}>
          <Text style={styles.skipText}>{t.common.skip}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
        style={styles.list}
      />

      <View style={styles.bottom}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            <Text style={styles.nextText}>{index < slides.length - 1 ? t.common.continue : t.onboarding.getStarted}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.lg,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brand: { fontFamily: 'HankenGrotesk-Bold', fontSize: 18, color: MD3Colors.onSurface },
  skipText: { fontFamily: 'HankenGrotesk-Medium', fontSize: 14, color: MD3Colors.onSurfaceVariant },
  list: { flex: 1 },
  slide: {
    width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, paddingBottom: 40,
  },
  iconContainer: { marginBottom: Spacing.xl },
  iconBg: {
    width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
  },
  slideTitle: { fontFamily: 'HankenGrotesk-Bold', fontSize: 32, color: MD3Colors.onSurface, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 40 },
  slideSubtitle: { fontFamily: 'HankenGrotesk-Regular', fontSize: 16, color: MD3Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 24 },
  bottom: {
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: Spacing.xl,
  },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: MD3Colors.surfaceContainer, marginBottom: Spacing.lg },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: MD3Colors.primaryFixedDim },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: MD3Colors.outlineVariant },
  dotActive: { backgroundColor: MD3Colors.primaryFixedDim, width: 18 },
  nextButton: { borderRadius: Radii.md, overflow: 'hidden' },
  nextGradient: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl,
  },
  nextText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: '#FFFFFF' },
});
