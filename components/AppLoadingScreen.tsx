import { View, StyleSheet } from 'react-native';
import { AppBackground } from '@/components/AppBackground';
import { SkeletonDashboard } from '@/components/Skeleton';
import { Spacing } from '@/lib/theme';
import { useScreenInsets } from '@/hooks/useScreenInsets';

export function AppLoadingScreen() {
  const { contentTop } = useScreenInsets();

  return (
    <AppBackground safeTop={false}>
      <View style={[styles.container, { paddingTop: contentTop }]}>
        <SkeletonDashboard />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
});
