import React, { useEffect, useState } from 'react';
import type { UserConsent } from '@contentful/experience-tracking';
import { initializeAnalyticClient } from '../analytics';
import type { AnalyticsAPI } from '../types/analytics';
import { useAnalyticsStore } from '../stores/useAnalyticsStore';
import { useAnalytics } from './useAnalytics';

const useUserConsent = (analyticsAPI: AnalyticsAPI) => {
  const [userConsent, setUserConsent] = useState<UserConsent>();

  useEffect(() => {
    analyticsAPI.getUserConsent().then((response) => setUserConsent(response));
  }, [analyticsAPI]);

  return userConsent;
};

export const useInitAnalytics = (analyticsAPI: AnalyticsAPI) => {
  const analyticsState = useAnalyticsStore((state: any) => state);
  const analyticsClient = useAnalytics();
  const userConsent = useUserConsent(analyticsAPI);

  React.useEffect(() => {
    if (!analyticsState.isInitialized && userConsent) {
      initializeAnalyticClient(analyticsClient, analyticsAPI, userConsent).then(() =>
        setTimeout(() => analyticsState.setInitialized(), 1000)
      );
    }
  }, [analyticsState, analyticsClient, analyticsAPI, userConsent]);
};
