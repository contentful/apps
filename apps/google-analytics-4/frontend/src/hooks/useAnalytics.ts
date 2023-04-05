import { config } from '../config';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { useMemo } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';

export function useAnalytics(): AnalyticsBrowser {
  const sdk = useSDK();

  const analyticsBrowser = useMemo(() => {
    const writeKey = config.segmentWriteKey;
    const _analyticsBrowser = AnalyticsBrowser.load({ writeKey });

    // this is an async call but per the Segmentation docs, it doesn't seem to matter when it
    // actually gets called (before or after track()) -- so this is why there's no need for
    // us to await here
    _analyticsBrowser.identify(sdk.ids.user);

    return _analyticsBrowser;
  }, []);

  return analyticsBrowser;
}
