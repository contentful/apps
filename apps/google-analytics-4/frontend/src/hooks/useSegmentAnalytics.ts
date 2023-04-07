import { AnalyticsBrowser } from '@segment/analytics-next';
import { SegmentAnalyticsContext } from 'providers/SegmentAnalyticsProvider';
import { useContext } from 'react';

export function useSegmentAnalytics(): AnalyticsBrowser {
  const { segmentAnalytics } = useContext(SegmentAnalyticsContext);

  if (!segmentAnalytics) {
    throw new Error(
      'SegmentAnalyticsContext not found. Make sure this hook is used inside a SegmentAnalyticsProvider'
    );
  }

  return segmentAnalytics;
}
