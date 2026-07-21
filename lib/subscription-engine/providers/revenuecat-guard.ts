import { Platform } from 'react-native';

const DISABLE_LOG = '[RevenueCat] RevenueCat disabled for internal beta';

let disableReasonLogged = false;

function isBetaDiagnosticsFlagEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_BETA_DIAGNOSTICS?.trim().toLowerCase();
  return flag === '1' || flag === 'true';
}

function getPlatformRevenueCatApiKey(): string | null {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS?.trim() || null;
  }

  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID?.trim() || null;
  }

  return null;
}

/** Android release build with RevenueCat Test Store key (test_...) — SDK must stay off. */
export function isAndroidReleaseTestStoreKey(): boolean {
  if (Platform.OS !== 'android' || __DEV__) {
    return false;
  }

  const apiKey = getPlatformRevenueCatApiKey();
  return apiKey?.startsWith('test_') ?? false;
}

/** RevenueCat must not be initialized (internal beta APK or Test Store key on Android release). */
export function isRevenueCatDisabledForInternalBeta(): boolean {
  return isBetaDiagnosticsFlagEnabled() || isAndroidReleaseTestStoreKey();
}

export function logRevenueCatDisabledForInternalBeta(): void {
  if (disableReasonLogged) return;
  disableReasonLogged = true;
  console.log(DISABLE_LOG);
}

export function getRevenueCatDisableLogMessage(): string {
  return DISABLE_LOG;
}
