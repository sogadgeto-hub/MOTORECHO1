import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/lib/theme';

interface WaveformAnimationProps {
  active: boolean;
  barCount?: number;
  color?: string;
}

export function WaveformAnimation({ active, barCount = 28, color = Colors.primary }: WaveformAnimationProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);
  return (
    <View style={styles.container}>
      {bars.map((i) => (
        <WaveformBar key={i} index={i} active={active} color={color} />
      ))}
    </View>
  );
}

function WaveformBar({ index, active, color }: { index: number; active: boolean; color: string }) {
  const heightAnim = useRef(new Animated.Value(4)).current;
  const maxHeight = useRef(28 + Math.random() * 32).current;
  const duration = useRef(400 + Math.random() * 300).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (loopRef.current) {
      loopRef.current.stop();
    }
    if (active) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(heightAnim, { toValue: maxHeight, duration, useNativeDriver: false }),
          Animated.timing(heightAnim, { toValue: 4, duration, useNativeDriver: false }),
        ])
      );
      loopRef.current.start();
    } else {
      Animated.timing(heightAnim, { toValue: 4, duration: 300, useNativeDriver: false }).start();
    }
    return () => loopRef.current?.stop();
  }, [active]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height: heightAnim,
          backgroundColor: color,
          marginLeft: index === 0 ? 0 : 3,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 0,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
