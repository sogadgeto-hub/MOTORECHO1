import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import type { UserPlan } from '@/lib/diagnostic-engine';
import type { PlanAccessSnapshot } from '@/lib/plan-access';
import type { SubscriptionInfo } from '../types';
import {
  hasActiveRevenueCatEntitlement,
  hasPremiumAccess,
  isSubscriptionActive,
} from '../subscription';
import {
  configureRevenueCat,
  isRevenueCatAvailable,
  isRevenueCatDisabledForInternalBeta,
  mapCustomerInfoToSubscription,
} from './revenuecat';
import { logRevenueCatDisabledForInternalBeta } from './revenuecat-guard';

export const REVENUECAT_OFFERING_IDS = {
  PREMIUM: 'default',
  GARAGE: 'garage',
} as const;

export type RevenueCatPlanPackages = {
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
};

export type RevenueCatLoadedOfferings = {
  premium: RevenueCatPlanPackages;
  garage: RevenueCatPlanPackages;
};

export type RevenueCatOfferingsLoadResult = {
  offerings: RevenueCatLoadedOfferings | null;
  error: 'not_configured' | 'beta_disabled' | 'network' | 'empty' | null;
};

export type RevenueCatPurchaseResult =
  | { ok: true; subscription: SubscriptionInfo; customerInfo: CustomerInfo }
  | { ok: false; cancelled: boolean; reason: string };

const EMPTY_PACKAGES: RevenueCatPlanPackages = { monthly: null, yearly: null };

export function logActiveEntitlements(customerInfo: CustomerInfo): void {
  const activeIds = Object.keys(customerInfo.entitlements.active);
  console.log(
    '[RevenueCat] Entitlements actifs:',
    activeIds.length > 0 ? activeIds.join(', ') : 'aucun'
  );
}

function pickPackage(
  offering: PurchasesOffering | null,
  packageType: typeof PACKAGE_TYPE.MONTHLY | typeof PACKAGE_TYPE.ANNUAL
): PurchasesPackage | null {
  if (!offering) return null;

  const match = offering.availablePackages.find((pkg) => pkg.packageType === packageType);
  if (match) return match;

  if (packageType === PACKAGE_TYPE.MONTHLY) {
    return offering.monthly ?? offering.availablePackages[0] ?? null;
  }

  return offering.annual ?? offering.availablePackages[0] ?? null;
}

function mapOfferingPackages(offering: PurchasesOffering | null): RevenueCatPlanPackages {
  return {
    monthly: pickPackage(offering, PACKAGE_TYPE.MONTHLY),
    yearly: pickPackage(offering, PACKAGE_TYPE.ANNUAL),
  };
}

/** Charge les offerings RevenueCat (default + garage). */
export async function loadRevenueCatOfferings(): Promise<RevenueCatOfferingsLoadResult> {
  if (isRevenueCatDisabledForInternalBeta()) {
    logRevenueCatDisabledForInternalBeta();
    return { offerings: null, error: 'beta_disabled' };
  }

  if (!isRevenueCatAvailable()) {
    console.log('[RevenueCat] Offerings indisponibles — SDK non configuré');
    return { offerings: null, error: 'not_configured' };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const premiumOffering =
      offerings.all[REVENUECAT_OFFERING_IDS.PREMIUM] ?? offerings.current ?? null;
    const garageOffering = offerings.all[REVENUECAT_OFFERING_IDS.GARAGE] ?? null;

    const loaded: RevenueCatLoadedOfferings = {
      premium: mapOfferingPackages(premiumOffering),
      garage: mapOfferingPackages(garageOffering),
    };

    const hasAnyPackage =
      loaded.premium.monthly ||
      loaded.premium.yearly ||
      loaded.garage.monthly ||
      loaded.garage.yearly;

    if (!hasAnyPackage) {
      console.log('[RevenueCat] Aucune offering/package disponible');
      return { offerings: null, error: 'empty' };
    }

    console.log('[RevenueCat] Offerings chargées', {
      premium: {
        monthly: loaded.premium.monthly?.identifier ?? null,
        yearly: loaded.premium.yearly?.identifier ?? null,
      },
      garage: {
        monthly: loaded.garage.monthly?.identifier ?? null,
        yearly: loaded.garage.yearly?.identifier ?? null,
      },
    });

    return { offerings: loaded, error: null };
  } catch (error) {
    console.log('[RevenueCat] Erreur chargement offerings:', error);
    return { offerings: null, error: 'network' };
  }
}

export function getPackagePriceLabel(pkg: PurchasesPackage | null): string | null {
  return pkg?.product.priceString ?? null;
}

export function resolvePackageForPlan(
  offerings: RevenueCatLoadedOfferings | null,
  plan: Extract<UserPlan, 'premium' | 'garage'>,
  billingCycle: 'monthly' | 'yearly'
): PurchasesPackage | null {
  if (!offerings) return null;

  const packages = plan === 'premium' ? offerings.premium : offerings.garage;
  return billingCycle === 'yearly' ? packages.yearly ?? packages.monthly : packages.monthly;
}

function isPurchaseCancelledError(error: unknown): boolean {
  const err = error as { code?: string; userCancelled?: boolean };
  if (err.userCancelled === true) return true;
  return err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

/** Lance purchasePackage() pour un package RevenueCat. */
export async function purchaseRevenueCatPackage(
  rcPackage: PurchasesPackage
): Promise<RevenueCatPurchaseResult> {
  if (isRevenueCatDisabledForInternalBeta()) {
    logRevenueCatDisabledForInternalBeta();
    return { ok: false, cancelled: false, reason: 'beta_disabled' };
  }

  if (!isRevenueCatAvailable()) {
    return { ok: false, cancelled: false, reason: 'not_configured' };
  }

  console.log('[RevenueCat] Achat lancé:', rcPackage.identifier);

  try {
    const { customerInfo } = await Purchases.purchasePackage(rcPackage);
    const subscription = mapCustomerInfoToSubscription(customerInfo);

    console.log('[RevenueCat] Achat réussi — plan:', subscription.plan);
    logActiveEntitlements(customerInfo);

    return { ok: true, subscription, customerInfo };
  } catch (error) {
    if (isPurchaseCancelledError(error)) {
      console.log("[RevenueCat] Achat annulé par l'utilisateur");
      return { ok: false, cancelled: true, reason: 'cancelled' };
    }

    console.log('[RevenueCat] Erreur achat:', error);
    return { ok: false, cancelled: false, reason: 'purchase_failed' };
  }
}

/** Initialise RevenueCat au démarrage puis pré-charge les offerings. */
export async function initializeRevenueCatApp(
  appUserId?: string
): Promise<RevenueCatOfferingsLoadResult> {
  if (isRevenueCatDisabledForInternalBeta()) {
    logRevenueCatDisabledForInternalBeta();
    return { offerings: null, error: 'beta_disabled' };
  }

  const configured = await configureRevenueCat(appUserId);
  if (!configured) {
    return { offerings: null, error: 'not_configured' };
  }

  console.log('[RevenueCat] RevenueCat initialisé');
  return loadRevenueCatOfferings();
}

/** Fusionne le plan RevenueCat actif dans le snapshot pour débloquer les droits immédiatement. */
export function mergeSnapshotWithSubscription(
  snapshot: PlanAccessSnapshot,
  subscription: SubscriptionInfo
): PlanAccessSnapshot {
  const hasPaidEntitlement =
    hasActiveRevenueCatEntitlement(subscription) ||
    (hasPremiumAccess(subscription) && subscription.provider === 'revenuecat');

  if (!hasPaidEntitlement && !isSubscriptionActive(subscription)) {
    return snapshot;
  }

  if (subscription.plan === 'garage' && hasPremiumAccess(subscription)) {
    return {
      ...snapshot,
      plan: 'garage',
      maxVehicles: -1,
      maxAnalyses: -1,
    };
  }

  if (subscription.plan === 'premium' && hasPremiumAccess(subscription)) {
    return {
      ...snapshot,
      plan: 'premium',
      maxVehicles: 2,
      maxAnalyses: -1,
    };
  }

  return snapshot;
}

export function createEmptyOfferings(): RevenueCatLoadedOfferings {
  return {
    premium: { ...EMPTY_PACKAGES },
    garage: { ...EMPTY_PACKAGES },
  };
}
