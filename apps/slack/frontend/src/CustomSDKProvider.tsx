import { init, KnownSDK } from '@contentful/app-sdk';
import { SDKContext } from '@contentful/react-apps-toolkit';
import { FC, PropsWithChildren, ReactElement, useEffect, useState } from 'react';
import { CustomAPIClient } from './api';

interface SDKProviderProps {
  loading?: ReactElement;
}

const DELAY_TIMEOUT = 4 * 1000;

/**
 * The Component providing the AppSdk, the useSDK hook can only be used within this Provider
 * @param props.loading an optional loading element that gets rendered while initializing the app
 */
export const CustomSDKProvider: FC<PropsWithChildren<SDKProviderProps>> = (props) => {
  const [sdk, setSDK] = useState<KnownSDK | undefined>();
  const [api, setApi] = useState<CustomAPIClient | undefined>();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      console.warn(
        "Your app is taking longer than expected to initialize. If you think this is an error with Contentful's App SDK, let us know: https://github.com/contentful/ui-extensions-sdk/issues"
      );
    }, DELAY_TIMEOUT);
    init(
      // @ts-expect-error private api not typed
      (sdk: KnownSDK, api: CustomAPIClient) => {
        setSDK(sdk);
        setApi(api);
        window.clearTimeout(timeout);
      },
      { makeCustomApi: CustomAPIClient.create }
    );
    return () => window.clearTimeout(timeout);
  }, []);

  if (!sdk || !api) {
    if (props.loading) {
      return props.loading;
    }
    return null;
  }

  // @ts-expect-error private api not typed
  return <SDKContext.Provider value={{ sdk, api }}>{props.children}</SDKContext.Provider>;
};
