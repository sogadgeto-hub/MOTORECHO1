import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function isBetaDiagnosticsEnabled(): boolean {
  return __DEV__ || process.env.EXPO_PUBLIC_BETA_DIAGNOSTICS === '1';
}

export function getAppVersionLabel(): string {
  return Constants.expoConfig?.version ?? 'unknown';
}

export function getBuildLabel(): string {
  const ios = Constants.expoConfig?.ios?.buildNumber;
  const android = Constants.expoConfig?.android?.versionCode;
  if (Platform.OS === 'ios' && ios) return String(ios);
  if (Platform.OS === 'android' && android) return String(android);
  return 'n/a';
}

export async function probeNetworkReachability(supabaseUrl?: string): Promise<'online' | 'offline' | 'unknown'> {
  if (!supabaseUrl) return 'unknown';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return 'online';
  } catch {
    return 'offline';
  }
}
