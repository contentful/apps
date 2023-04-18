import React, { FC, PropsWithChildren, ReactElement, useEffect, useState } from 'react';
import { init, KnownAppSDK } from '@contentful/app-sdk';
import { SDKContext } from '@contentful/react-apps-toolkit/dist/SDKProvider';

const DELAY_TIMEOUT = 4 * 1000;

interface SDKProviderProps {
  loading?: ReactElement;
}

// This is an override of the SDKProvider from `react-apps-toolkit`,
// as the package does not include the canary version of the app-sdk
// which is needed for the app to run in the home location

// TODO: can be removed when released
export const SDKProvider: FC<PropsWithChildren<SDKProviderProps>> = (props) => {
  const [sdk, setSDK] = useState<KnownAppSDK | undefined>();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      console.warn(
        "Your app is taking longer than expected to initialize. If you think this is an error with Contentful's App SDK, let us know: https://github.com/contentful/ui-extensions-sdk/issues"
      );
    }, DELAY_TIMEOUT);
    init((sdk: KnownAppSDK) => {
      setSDK(sdk);
      window.clearTimeout(timeout);
    });
    return () => window.clearTimeout(timeout);
  }, []);

  if (!sdk) {
    if (props.loading) {
      return props.loading;
    }
    return null;
  }

  return <SDKContext.Provider value={{ sdk }}>{props.children}</SDKContext.Provider>;
};
