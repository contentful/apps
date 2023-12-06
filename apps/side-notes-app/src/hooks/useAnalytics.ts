import type { AnalyticsClient } from '../analytics';
import { useAnalyticsStore } from '../stores/useAnalyticsStore';

export const useAnalytics = () => {
  return useAnalyticsStore(
    // @ts-expect-error
    (state: { analyticsClient: any }) => state.analyticsClient
  ) as AnalyticsClient;
};
