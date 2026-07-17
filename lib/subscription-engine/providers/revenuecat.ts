import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesEntitlementInfo,
} from 'react-native-purchases';
import type { UserPlan } from '@/lib/diagnostic-engine';
import { daysUntilExpiration, createFreeSubscription } from '../subscription';
import type { SubscriptionInfo, SubscriptionStatus } from '../types';
import type { SubscriptionProviderAdapter } from './types';

export const REVENUECAT_ENTITLEMENTS = {
  PREMIUM: 'premium',
  GARAGE: 'garage_pro',
} as const;

let configured = false;

function getRevenueCatApiKey(): string | null {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS?.trim() || null;
  }

  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID?.trim() || null;
  }

  return null;
}

/** Indique si une clé publique RevenueCat est configurée pour la plateforme courante. */
export function isRevenueCatConfigured(): boolean {
  return getRevenueCatApiKey() !== null;
}

/** RevenueCat nécessite un development build — Expo Go utilise le mode Preview API. */
export function isRevenueCatNativeBuildRequired(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/** RevenueCat est utilisable (mobile + clé publique). */
export function isRevenueCatAvailable(): boolean {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }

  return isRevenueCatConfigured();
}

function createRevenueCatFreeSubscription(): SubscriptionInfo {
  return {
    plan: 'free',
    provider: 'revenuecat',
    status: 'active',
    startDate: null,
    endDate: null,
    renewalDate: null,
    isAutoRenew: false,
    isTrial: false,
    daysRemaining: null,
  };
}

function resolveStatusFromEntitlement(
  entitlement: PurchasesEntitlementInfo
): SubscriptionStatus {
  if (!entitlement.isActive) {
    return 'expired';
  }

  if (entitlement.periodType === 'TRIAL') {
    return 'trial';
  }

  if (entitlement.billingIssueDetectedAt != null) {
    return 'grace_period';
  }

  if (entitlement.unsubscribeDetectedAt != null && !entitlement.willRenew) {
    return 'cancelled';
  }

  return 'active';
}

function mapEntitlementToSubscription(
  plan: UserPlan,
  entitlement: PurchasesEntitlementInfo
): SubscriptionInfo {
  const endDate = entitlement.expirationDate ?? null;
  const isTrial = entitlement.periodType === 'TRIAL';

  const info: SubscriptionInfo = {
    plan,
    provider: 'revenuecat',
    status: resolveStatusFromEntitlement(entitlement),
    startDate: entitlement.originalPurchaseDate ?? null,
    endDate,
    renewalDate: endDate,
    isAutoRenew: entitlement.willRenew,
    isTrial,
    daysRemaining: null,
  };

  info.daysRemaining = daysUntilExpiration(info);
  return info;
}

/** Mappe les entitlements RevenueCat vers SubscriptionInfo interne. */
export function mapCustomerInfoToSubscription(customerInfo: CustomerInfo): SubscriptionInfo {
  const active = customerInfo.entitlements.active;
  const garage = active[REVENUECAT_ENTITLEMENTS.GARAGE];
  const premium = active[REVENUECAT_ENTITLEMENTS.PREMIUM];

  if (garage?.isActive) {
    return mapEntitlementToSubscription('garage', garage);
  }

  if (premium?.isActive) {
    return mapEntitlementToSubscription('premium', premium);
  }

  return createRevenueCatFreeSubscription();
}

/** Initialise le SDK RevenueCat (clés publiques EXPO_PUBLIC uniquement). */
export async function configureRevenueCat(appUserId?: string): Promise<boolean> {
  if (!isRevenueCatAvailable()) {
    configured = false;
    return false;
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    configured = false;
    return false;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({
      apiKey,
      appUserID: appUserId,
    });

    configured = true;
    console.log('[RevenueCat] RevenueCat initialisé', appUserId ? `(user: ${appUserId})` : '');
    return true;
  } catch {
    configured = false;
    return false;
  }
}

/** Récupère l'abonnement courant depuis RevenueCat. */
export async function fetchRevenueCatSubscription(): Promise<SubscriptionInfo> {
  if (!isRevenueCatAvailable()) {
    return createFreeSubscription();
  }

  if (!configured && !(await configureRevenueCat())) {
    return createFreeSubscription();
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return mapCustomerInfoToSubscription(customerInfo);
  } catch {
    return createFreeSubscription();
  }
}

/** Restaure les achats RevenueCat. */
export async function restoreRevenueCatPurchases(): Promise<SubscriptionInfo> {
  if (!isRevenueCatAvailable()) {
    return createFreeSubscription();
  }

  if (!configured && !(await configureRevenueCat())) {
    return createFreeSubscription();
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return mapCustomerInfoToSubscription(customerInfo);
  } catch {
    return createFreeSubscription();
  }
}

export const revenueCatSubscriptionProvider: SubscriptionProviderAdapter = {
  providerId: 'revenuecat',
  isAvailable: isRevenueCatAvailable,
  configure: (options) => configureRevenueCat(options?.appUserId),
  fetchSubscription: fetchRevenueCatSubscription,
  restorePurchases: restoreRevenueCatPurchases,
};
