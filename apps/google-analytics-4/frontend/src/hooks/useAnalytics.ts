import { config } from '../config';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { useMemo } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';

export function useAnalytics(): AnalyticsBrowser {
  const sdk = useSDK();

  const analyticsBrowser = useMemo(() => {
    const writeKey = config.segmentWriteKey;
    const _analyticsBrowser = AnalyticsBrowser.load({ writeKey });
    _analyticsBrowser.identify(sdk.ids.user);
    return _analyticsBrowser;
  }, []);

  return analyticsBrowser;
}
