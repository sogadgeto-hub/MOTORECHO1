export type {
  SubscriptionStatus,
  SubscriptionProvider,
  SubscriptionInfo,
  PermissionResult,
} from './types';

export {
  getSubscriptionStatus,
  isSubscriptionActive,
  hasPremiumAccess,
  hasGarageAccess,
  hasActiveRevenueCatEntitlement,
  daysUntilExpiration,
  canRenew,
  buildManualSubscriptionFromSnapshot,
  createFreeSubscription,
} from './subscription';

export {
  getPlanSyncState,
  shouldBypassServerPlanCheck,
  type PlanSyncState,
} from './server-sync';

export {
  resolveEffectiveSnapshot,
  resolveSubscriptionWithRevenueCatPriority,
  logAccessState,
  type AccessStatePhase,
} from './access-state';

export {
  getEffectivePlan,
  getHighestAccessibleReportTier,
  canViewReportTier,
  getDefaultReportTier,
  resolveReportTier,
  type ReportTier,
} from './report-access';

export {
  checkVehicleLimit,
  checkAnalysisLimit,
  checkDetailedDiagnosticLimit,
  type PlanAccessSnapshot,
  type PlanAccessValidation,
} from './limits';

export {
  canAddVehicle,
  canAnalyze,
  canViewDetailedDiagnostic,
  canExportPdf,
  canUseGarageWorkspace,
  verifyCanAddVehicle,
  verifyCanAnalyze,
} from './permissions';

export {
  manualSubscriptionProvider,
  revenueCatSubscriptionProvider,
  configureRevenueCat,
  fetchRevenueCatSubscription,
  restoreRevenueCatPurchases,
  mapCustomerInfoToSubscription,
  isRevenueCatAvailable,
  isRevenueCatConfigured,
  isRevenueCatNativeBuildRequired,
  isRevenueCatDisabledForInternalBeta,
  REVENUECAT_ENTITLEMENTS,
  REVENUECAT_OFFERING_IDS,
  loadRevenueCatOfferings,
  purchaseRevenueCatPackage,
  initializeRevenueCatApp,
  mergeSnapshotWithSubscription,
  getPackagePriceLabel,
  resolvePackageForPlan,
  type SubscriptionProviderAdapter,
  type SubscriptionProviderConfigureOptions,
  type RevenueCatLoadedOfferings,
  type RevenueCatPurchaseResult,
} from './providers';

export { SubscriptionEngineProvider, useSubscriptionEngine } from './context';
