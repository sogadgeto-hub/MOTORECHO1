import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { logBetaEvent } from '@/lib/beta-logger';
import { fetchPlanAccessSnapshot, type PlanAccessSnapshot } from '@/lib/plan-access';
import type { UserPlan } from '@/lib/diagnostic-engine';
import {
  canAddVehicle as evaluateCanAddVehicle,
  canAnalyze as evaluateCanAnalyze,
  canViewDetailedDiagnostic as evaluateCanViewDetailedDiagnostic,
  canExportPdf as evaluateCanExportPdf,
  canUseGarageWorkspace as evaluateCanUseGarageWorkspace,
  verifyCanAddVehicle,
  verifyCanAnalyze,
  createFreeSubscription,
  getEffectivePlan,
  getHighestAccessibleReportTier,
  canViewReportTier,
  getDefaultReportTier,
  type ReportTier,
  type PermissionResult,
  type SubscriptionInfo,
} from '@/lib/subscription-engine';
import {
  logAccessState,
  resolveEffectiveSnapshot,
  resolveSubscriptionWithRevenueCatPriority,
} from '@/lib/subscription-engine/access-state';
import {
  createEmptyOfferings,
  getPackagePriceLabel,
  initializeRevenueCatApp,
  purchaseRevenueCatPackage,
  resolvePackageForPlan,
  type RevenueCatLoadedOfferings,
  type RevenueCatPurchaseResult,
} from '@/lib/subscription-engine/providers/revenuecat-offerings';
import type { PurchasesPackage } from 'react-native-purchases';

const DEFAULT_SNAPSHOT: PlanAccessSnapshot = {
  plan: 'free',
  vehicleCount: 0,
  maxVehicles: 1,
  monthlyAnalyses: 0,
  maxAnalyses: 3,
};

type SubscriptionEngineContextValue = {
  subscription: SubscriptionInfo;
  snapshot: PlanAccessSnapshot;
  plan: UserPlan;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshUsage: (phase?: 'after_analysis' | 'after_vehicle') => Promise<void>;
  isFreePlan: boolean;
  isPaidPlan: boolean;
  canAddVehicle: PermissionResult;
  canAnalyze: PermissionResult;
  canViewDetailedDiagnostic: PermissionResult;
  canExportPdf: PermissionResult;
  canUseGarageWorkspace: PermissionResult;
  verifyAddVehicle: () => ReturnType<typeof verifyCanAddVehicle>;
  verifyAnalyze: () => ReturnType<typeof verifyCanAnalyze>;
  offerings: RevenueCatLoadedOfferings;
  offeringsLoading: boolean;
  offeringsError: 'not_configured' | 'beta_disabled' | 'network' | 'empty' | null;
  getPriceLabel: (plan: Extract<UserPlan, 'premium' | 'garage'>, billingCycle: 'monthly' | 'yearly') => string | null;
  getEffectivePlan: () => UserPlan;
  getHighestAccessibleReportTier: () => ReportTier;
  canViewReportTier: (tier: ReportTier) => boolean;
  getDefaultReportTier: () => ReportTier;
  purchasePlan: (
    plan: Extract<UserPlan, 'premium' | 'garage'>,
    billingCycle: 'monthly' | 'yearly'
  ) => Promise<RevenueCatPurchaseResult | { ok: false; cancelled: boolean; reason: string }>;
};

const SubscriptionEngineContext = createContext<SubscriptionEngineContextValue | null>(null);

async function loadAccessState(
  cachedPaidSubscription: SubscriptionInfo | null,
  phase: 'bootstrap' | 'refresh' | 'after_purchase' | 'after_analysis' | 'after_vehicle'
): Promise<{
  subscription: SubscriptionInfo;
  snapshot: PlanAccessSnapshot;
  cachedPaidSubscription: SubscriptionInfo | null;
}> {
  const baseSnapshot = await fetchPlanAccessSnapshot();
  const { subscription, cachedPaidSubscription: nextCache } =
    await resolveSubscriptionWithRevenueCatPriority(baseSnapshot, cachedPaidSubscription);
  const snapshot = resolveEffectiveSnapshot(baseSnapshot, subscription);

  logAccessState(phase, subscription, baseSnapshot, snapshot);

  return { subscription, snapshot, cachedPaidSubscription: nextCache };
}

export function SubscriptionEngineProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<PlanAccessSnapshot>(DEFAULT_SNAPSHOT);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(createFreeSubscription());
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState<RevenueCatLoadedOfferings>(createEmptyOfferings());
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [offeringsError, setOfferingsError] = useState<
    'not_configured' | 'beta_disabled' | 'network' | 'empty' | null
  >(null);
  const cachedPaidSubscriptionRef = useRef<SubscriptionInfo | null>(null);

  const applyAccessState = useCallback(
    (
      subscription: SubscriptionInfo,
      snapshot: PlanAccessSnapshot,
      cachedPaidSubscription: SubscriptionInfo | null
    ) => {
      cachedPaidSubscriptionRef.current = cachedPaidSubscription;
      setSubscription(subscription);
      setSnapshot(snapshot);
    },
    []
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      cachedPaidSubscriptionRef.current = null;
      setSnapshot(DEFAULT_SNAPSHOT);
      setSubscription(createFreeSubscription());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const next = await loadAccessState(cachedPaidSubscriptionRef.current, 'refresh');
      applyAccessState(next.subscription, next.snapshot, next.cachedPaidSubscription);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Subscription refresh failed';
      logBetaEvent('subscription', message, 'SUBSCRIPTION_REFRESH');
      cachedPaidSubscriptionRef.current = null;
      setSnapshot(DEFAULT_SNAPSHOT);
      setSubscription(createFreeSubscription());
    } finally {
      setLoading(false);
    }
  }, [userId, applyAccessState]);

  const refreshUsage = useCallback(async (phase: 'after_analysis' | 'after_vehicle' = 'after_analysis') => {
    if (!userId) return;

    try {
      const next = await loadAccessState(cachedPaidSubscriptionRef.current, phase);
      applyAccessState(next.subscription, next.snapshot, next.cachedPaidSubscription);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Usage refresh failed';
      logBetaEvent('subscription', message, 'USAGE_REFRESH_FAILED');
      // Conserver l'état courant — ne pas écraser un entitlement actif par erreur transitoire.
    }
  }, [userId, applyAccessState]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!userId) {
        setSnapshot(DEFAULT_SNAPSHOT);
        setSubscription(createFreeSubscription());
        setLoading(false);
        return;
      }

      setLoading(true);
      setOfferingsLoading(true);

      const initResult = await initializeRevenueCatApp(userId);
      if (!cancelled) {
        setOfferings(initResult.offerings ?? createEmptyOfferings());
        setOfferingsError(initResult.error);
        setOfferingsLoading(false);
        if (initResult.error === 'beta_disabled') {
          logBetaEvent('subscription', 'RevenueCat disabled for internal beta', 'RC_BETA_DISABLED');
        }
      }

      if (!cancelled) {
        try {
          const next = await loadAccessState(null, 'bootstrap');
          if (!cancelled) {
            applyAccessState(next.subscription, next.snapshot, next.cachedPaidSubscription);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Subscription bootstrap failed';
          logBetaEvent('subscription', message, 'SUBSCRIPTION_BOOTSTRAP_FAILED');
          if (!cancelled) {
            setSnapshot(DEFAULT_SNAPSHOT);
            setSubscription(createFreeSubscription());
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [userId, applyAccessState]);

  const getPriceLabel = useCallback(
    (plan: Extract<UserPlan, 'premium' | 'garage'>, billingCycle: 'monthly' | 'yearly') => {
      const pkg = resolvePackageForPlan(offerings, plan, billingCycle);
      return getPackagePriceLabel(pkg);
    },
    [offerings]
  );

  const purchasePlan = useCallback(
    async (plan: Extract<UserPlan, 'premium' | 'garage'>, billingCycle: 'monthly' | 'yearly') => {
      const rcPackage = resolvePackageForPlan(offerings, plan, billingCycle);
      if (!rcPackage) {
        console.log('[RevenueCat] Package introuvable pour', plan, billingCycle);
        return { ok: false as const, cancelled: false, reason: 'no_package' };
      }

      const result = await purchaseRevenueCatPackage(rcPackage);
      if (result.ok) {
        cachedPaidSubscriptionRef.current = result.subscription;
        const baseSnapshot = await fetchPlanAccessSnapshot();
        const mergedSnapshot = resolveEffectiveSnapshot(baseSnapshot, result.subscription);
        logAccessState('after_purchase', result.subscription, baseSnapshot, mergedSnapshot);
        setSubscription(result.subscription);
        setSnapshot(mergedSnapshot);
      }

      return result;
    },
    [offerings]
  );

  const plan = subscription.plan;

  const getEffectivePlanFn = useCallback(
    () => getEffectivePlan(subscription, snapshot),
    [subscription, snapshot]
  );

  const getHighestAccessibleReportTierFn = useCallback(
    () => getHighestAccessibleReportTier(subscription, snapshot),
    [subscription, snapshot]
  );

  const canViewReportTierFn = useCallback(
    (tier: ReportTier) => canViewReportTier(tier, subscription, snapshot),
    [subscription, snapshot]
  );

  const getDefaultReportTierFn = useCallback(
    () => getDefaultReportTier(subscription, snapshot),
    [subscription, snapshot]
  );

  const verifyAddVehicleWithLogs = useCallback(
    () => verifyCanAddVehicle(subscription, snapshot),
    [subscription, snapshot]
  );

  const verifyAnalyzeWithLogs = useCallback(async () => {
    const effectiveSnapshot = resolveEffectiveSnapshot(snapshot, subscription);

    if (__DEV__) {
      logAccessState('before_verify_analyze', subscription, snapshot, effectiveSnapshot);
    }

    const result = await verifyCanAnalyze(subscription, snapshot);

    if (__DEV__) {
      console.log('[SubscriptionEngine] after_verify_analyze', {
        allowed: result.allowed,
        plan: result.plan,
        reason: result.reason ?? null,
        upgradeTo: result.upgradeTo ?? null,
      });
    }

    return result;
  }, [subscription, snapshot]);

  const value = useMemo<SubscriptionEngineContextValue>(
    () => ({
      subscription,
      snapshot,
      plan,
      loading,
      refresh,
      refreshUsage,
      isFreePlan: plan === 'free',
      isPaidPlan: plan === 'premium' || plan === 'garage',
      canAddVehicle: evaluateCanAddVehicle(subscription, snapshot),
      canAnalyze: evaluateCanAnalyze(subscription, snapshot),
      canViewDetailedDiagnostic: evaluateCanViewDetailedDiagnostic(subscription, snapshot),
      canExportPdf: evaluateCanExportPdf(subscription),
      canUseGarageWorkspace: evaluateCanUseGarageWorkspace(subscription),
      verifyAddVehicle: verifyAddVehicleWithLogs,
      verifyAnalyze: verifyAnalyzeWithLogs,
      offerings,
      offeringsLoading,
      offeringsError,
      getPriceLabel,
      getEffectivePlan: getEffectivePlanFn,
      getHighestAccessibleReportTier: getHighestAccessibleReportTierFn,
      canViewReportTier: canViewReportTierFn,
      getDefaultReportTier: getDefaultReportTierFn,
      purchasePlan,
    }),
    [
      subscription,
      snapshot,
      plan,
      loading,
      refresh,
      refreshUsage,
      offerings,
      offeringsLoading,
      offeringsError,
      getPriceLabel,
      purchasePlan,
      getEffectivePlanFn,
      getHighestAccessibleReportTierFn,
      canViewReportTierFn,
      getDefaultReportTierFn,
      verifyAddVehicleWithLogs,
      verifyAnalyzeWithLogs,
    ]
  );

  return (
    <SubscriptionEngineContext.Provider value={value}>{children}</SubscriptionEngineContext.Provider>
  );
}

export function useSubscriptionEngine(): SubscriptionEngineContextValue {
  const context = useContext(SubscriptionEngineContext);
  if (!context) {
    throw new Error('useSubscriptionEngine must be used within SubscriptionEngineProvider');
  }
  return context;
}

export type { PermissionResult, SubscriptionInfo, PlanAccessSnapshot, PurchasesPackage };
