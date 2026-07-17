import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, type ViewStyle, type StyleProp } from 'react-native';
import { Animation, Card, Colors, Radii } from '@/lib/theme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = Radii.sm,
  style,
}: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 0.75,
          duration: Animation.slow * 3,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.35,
          duration: Animation.slow * 3,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity: shimmer },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.card}>
      <Skeleton width="45%" height={14} />
      <Skeleton width="100%" height={12} style={styles.line} />
      {lines > 2 ? <Skeleton width="80%" height={12} style={styles.line} /> : null}
      {lines > 3 ? <Skeleton width="60%" height={12} style={styles.line} /> : null}
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listRow}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={styles.listContent}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={12} style={styles.line} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={styles.dashboard}>
      <View style={styles.dashboardHeader}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.dashboardHeaderText}>
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={12} style={styles.line} />
        </View>
      </View>
      <Skeleton width={180} height={180} borderRadius={90} style={styles.gauge} />
      <SkeletonCard lines={2} />
      <SkeletonList count={3} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surfaceElevated,
  },
  card: {
    ...Card,
    padding: Card.padding,
    borderRadius: Card.borderRadius,
    backgroundColor: Card.backgroundColor,
    borderWidth: Card.borderWidth,
    borderColor: Card.borderColor,
  },
  line: {
    marginTop: 10,
  },
  list: {
    gap: 12,
    width: '100%',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Card.padding,
    borderRadius: Card.borderRadius,
    backgroundColor: Card.backgroundColor,
    borderWidth: Card.borderWidth,
    borderColor: Card.borderColor,
  },
  listContent: {
    flex: 1,
  },
  dashboard: {
    width: '100%',
    gap: 20,
    paddingHorizontal: 4,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dashboardHeaderText: {
    flex: 1,
  },
  gauge: {
    alignSelf: 'center',
    marginVertical: 8,
  },
});
