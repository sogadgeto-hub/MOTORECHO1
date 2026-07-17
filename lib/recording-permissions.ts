import { Linking } from 'react-native';
import { Audio } from 'expo-av';

export type MicPermissionStatus = 'granted' | 'denied' | 'blocked';

export async function getMicPermissionStatus(): Promise<MicPermissionStatus> {
  const current = await Audio.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (current.canAskAgain === false) return 'blocked';
  return 'denied';
}

export async function requestMicPermission(): Promise<MicPermissionStatus> {
  const current = await Audio.getPermissionsAsync();
  if (current.granted) return 'granted';

  const requested = await Audio.requestPermissionsAsync();
  if (requested.granted) return 'granted';
  if (requested.canAskAgain === false) return 'blocked';
  return 'denied';
}

export async function openAppSettings(): Promise<boolean> {
  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}
