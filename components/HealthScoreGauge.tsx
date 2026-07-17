import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Animation } from '@/lib/theme';

interface HealthScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function HealthScoreGauge({ score, size = 180, strokeWidth = 14, label }: HealthScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const [dashOffset, setDashOffset] = useState(circumference);

  const color = score >= 85 ? Colors.success : score >= 70 ? Colors.warning : score >= 50 ? '#FF9F43' : Colors.danger;
  const gradientId = `gauge-${score}`;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: score / 100,
      duration: Animation.slow * 5,
      useNativeDriver: false,
    }).start();

    const listener = progressAnim.addListener(({ value }) => {
      setDashOffset(circumference - value * circumference);
    });

    return () => progressAnim.removeListener(listener);
  }, [score]);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} />
            <Stop offset="1" stopColor={color} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.surfaceElevated}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          rotation={-90}
          originX={center}
          originY={center}
        />
      </Svg>
      <View style={[styles.textContainer, { width: size, height: size }]}>
        <Text style={[styles.scoreText, { color }]}>{score}</Text>
        <Text style={styles.labelText}>{label ?? 'Health Score'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: 'Inter-Bold',
    fontSize: 42,
  },
  labelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
