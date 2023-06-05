import { AnalyticsBrowser } from '@segment/analytics-next';
import { config } from 'config';
import { createContext, ReactNode } from 'react';

export const SegmentAnalyticsContext = createContext<{ segmentAnalytics: AnalyticsBrowser | null }>(
  { segmentAnalytics: null }
);

export const SegmentAnalyticsProvider = (props: { children: ReactNode }) => {
  const writeKey = config.segmentWriteKey;
  const segmentAnalytics = AnalyticsBrowser.load({ writeKey });

  return (
    <SegmentAnalyticsContext.Provider value={{ segmentAnalytics }}>
      {props.children}
    </SegmentAnalyticsContext.Provider>
  );
};
