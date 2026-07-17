import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { Card, Shadows } from '@/lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  border?: boolean;
  padded?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 24,
  border = true,
  padded = false,
}: GlassCardProps) {
  return (
    <View style={[styles.card, border && styles.bordered, padded && styles.padded, style]}>
      <BlurView intensity={intensity} style={styles.blur} tint="dark" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Card.borderRadius,
    backgroundColor: Card.backgroundColor,
    overflow: 'hidden',
    ...Shadows.card,
  },
  bordered: {
    borderWidth: Card.borderWidth,
    borderColor: Card.borderColor,
  },
  padded: {
    padding: Card.padding,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Card.borderRadius,
  },
  content: {
    zIndex: 1,
  },
});
