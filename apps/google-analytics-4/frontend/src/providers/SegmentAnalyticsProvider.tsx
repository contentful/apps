import { useSDK } from '@contentful/react-apps-toolkit';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { config } from 'config';
import { createContext, ReactNode } from 'react';

export const SegmentAnalyticsContext = createContext<{ segmentAnalytics: AnalyticsBrowser | null }>(
  { segmentAnalytics: null }
);

export const SegmentAnalyticsProvider = (props: { children: ReactNode }) => {
  const sdk = useSDK();
  const writeKey = config.segmentWriteKey;
  const segmentAnalytics = AnalyticsBrowser.load({ writeKey });

  // this is async, but per the Segment docs it doesn't need to be awaited since identify can safely be called
  // before or after calls to page(), track() etc.
  segmentAnalytics.identify(sdk.ids.user);

  return (
    <SegmentAnalyticsContext.Provider value={{ segmentAnalytics }}>
      {props.children}
    </SegmentAnalyticsContext.Provider>
  );
};
