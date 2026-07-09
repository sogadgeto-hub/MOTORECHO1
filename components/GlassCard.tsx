import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { MD3Colors } from '@/lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  border?: boolean;
}

export function GlassCard({ children, style, intensity = 24, border = true }: GlassCardProps) {
  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={intensity} style={styles.blur} tint="dark" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    // Inner shadow simulated via top/left border
    // Note: box-shadow inset not directly available in RN
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  content: {
    zIndex: 1,
  },
});
