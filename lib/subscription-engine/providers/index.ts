export type {
  SubscriptionProviderAdapter,
  SubscriptionProviderConfigureOptions,
} from './types';

export { manualSubscriptionProvider } from './manual';

export {
  REVENUECAT_ENTITLEMENTS,
  configureRevenueCat,
  fetchRevenueCatSubscription,
  restoreRevenueCatPurchases,
  mapCustomerInfoToSubscription,
  isRevenueCatAvailable,
  isRevenueCatConfigured,
  isRevenueCatNativeBuildRequired,
  revenueCatSubscriptionProvider,
} from './revenuecat';

export {
  REVENUECAT_OFFERING_IDS,
  loadRevenueCatOfferings,
  purchaseRevenueCatPackage,
  initializeRevenueCatApp,
  mergeSnapshotWithSubscription,
  getPackagePriceLabel,
  resolvePackageForPlan,
  createEmptyOfferings,
  logActiveEntitlements,
  type RevenueCatLoadedOfferings,
  type RevenueCatPlanPackages,
  type RevenueCatOfferingsLoadResult,
  type RevenueCatPurchaseResult,
} from './revenuecat-offerings';
