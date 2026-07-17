import type { SubscriptionInfo, SubscriptionProvider } from '../types';

export type SubscriptionProviderConfigureOptions = {
  appUserId?: string;
};

export interface SubscriptionProviderAdapter {
  readonly providerId: SubscriptionProvider;
  isAvailable(): boolean;
  configure(options?: SubscriptionProviderConfigureOptions): Promise<boolean>;
  fetchSubscription(): Promise<SubscriptionInfo>;
  restorePurchases(): Promise<SubscriptionInfo>;
}
