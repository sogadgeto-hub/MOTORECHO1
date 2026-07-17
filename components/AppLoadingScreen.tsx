import { View, StyleSheet } from 'react-native';
import { AppBackground } from '@/components/AppBackground';
import { SkeletonDashboard } from '@/components/Skeleton';
import { Spacing } from '@/lib/theme';

export function AppLoadingScreen() {
  return (
    <AppBackground>
      <View style={styles.container}>
        <SkeletonDashboard />
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
});
