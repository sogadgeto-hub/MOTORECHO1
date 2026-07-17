import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

async function safeHaptic(fn: () => Promise<void>): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await fn();
  } catch {
    // Device may not support haptics
  }
}

export function hapticLight(): Promise<void> {
  return safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticMedium(): Promise<void> {
  return safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticSuccess(): Promise<void> {
  return safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function hapticSelection(): Promise<void> {
  return safeHaptic(() => Haptics.selectionAsync());
}
