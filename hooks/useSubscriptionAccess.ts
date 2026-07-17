import { useSubscriptionEngine } from '@/lib/subscription-engine/context';
export { SubscriptionEngineProvider } from '@/lib/subscription-engine/context';
export type { PermissionResult, SubscriptionInfo } from '@/lib/subscription-engine';
export type { PlanAccessSnapshot } from '@/lib/plan-access';

/** Compatibilité — le userId est géré par SubscriptionEngineProvider. */
export function useSubscriptionAccess(_userId?: string) {
  return useSubscriptionEngine();
}
