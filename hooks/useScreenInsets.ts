import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Hauteur visible de la tab bar (hors safe area basse). */
export const TAB_BAR_BODY_HEIGHT = 56;

export function useScreenInsets() {
  const insets = useSafeAreaInsets();

  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    /** Espace sous le header / barre d'état pour le contenu scrollable. */
    contentTop: insets.top + 16,
    /** Padding bas pour contenu au-dessus de la tab bar personnalisée. */
    tabBarScrollPadding: TAB_BAR_BODY_HEIGHT + insets.bottom + 16,
    /** Hauteur totale tab bar incluant la barre de navigation Android. */
    tabBarHeight: TAB_BAR_BODY_HEIGHT + insets.bottom + 8,
  };
}
