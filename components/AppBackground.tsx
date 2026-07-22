import { View, StyleSheet } from 'react-native';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { MD3Colors } from '@/lib/theme';

type AppBackgroundProps = {
  children: React.ReactNode;
  /** Applique l'inset haut (barre d'état). Désactiver si SafeScreen parent gère déjà le haut. */
  safeTop?: boolean;
};

export function AppBackground({ children, safeTop = true }: AppBackgroundProps) {
  const { top } = useScreenInsets();

  return (
    <View style={[styles.container, safeTop && top > 0 ? { paddingTop: top } : null]}>
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
