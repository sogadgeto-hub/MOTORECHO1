import { View, StyleSheet } from 'react-native';
import { MD3Colors } from '@/lib/theme';

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {/* Background decorative blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3Colors.background,
  },
  blobTop: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '50%',
    height: '50%',
    borderRadius: 999,
    backgroundColor: 'rgba(0, 242, 255, 0.04)',
    opacity: 0.2,
  },
  blobBottom: {
    position: 'absolute',
    bottom: '-10%',
    left: '-10%',
    width: '40%',
    height: '40%',
    borderRadius: 999,
    backgroundColor: 'rgba(5, 108, 237, 0.03)',
    opacity: 0.2,
  },
});
