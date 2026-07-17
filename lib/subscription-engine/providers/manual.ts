import { fetchPlanAccessSnapshot } from '@/lib/plan-access';
import {
  buildManualSubscriptionFromSnapshot,
  createFreeSubscription,
} from '../subscription';
import type { SubscriptionProviderAdapter } from './types';

export const manualSubscriptionProvider: SubscriptionProviderAdapter = {
  providerId: 'manual',

  isAvailable() {
    return true;
  },

  async configure() {
    return true;
  },

  async fetchSubscription() {
    try {
      const snapshot = await fetchPlanAccessSnapshot();
      return buildManualSubscriptionFromSnapshot(snapshot);
    } catch {
      return createFreeSubscription();
    }
  },

  async restorePurchases() {
    return this.fetchSubscription();
  },
};
