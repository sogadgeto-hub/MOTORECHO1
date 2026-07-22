import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useScreenInsets } from '@/hooks/useScreenInsets';

type SafeEdge = 'top' | 'bottom' | 'left' | 'right';

type SafeScreenProps = {
  children: React.ReactNode;
  edges?: SafeEdge[];
  style?: StyleProp<ViewStyle>;
};

/** Applique les insets système réels (safe area) sans marge fixe par appareil. */
export function SafeScreen({
  children,
  edges = ['top', 'bottom'],
  style,
}: SafeScreenProps) {
  const insets = useScreenInsets();

  return (
    <View
      style={[
        {
          flex: 1,
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: edges.includes('left') ? insets.left : 0,
          paddingRight: edges.includes('right') ? insets.right : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
