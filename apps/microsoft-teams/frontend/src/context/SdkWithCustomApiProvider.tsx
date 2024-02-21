import { KnownAppSDK, init as sdkInit } from '@contentful/app-sdk';
import { FC, PropsWithChildren, ReactElement, createContext, useEffect, useState } from 'react';
import { SDKContext } from '@contentful/react-apps-toolkit';

const DELAY_TIMEOUT = 4 * 1000;

// reimplimentated type defintiion for Channel class which is not exported from https://github.com/contentful/ui-extensions-sdk/blob/master/lib/channel.ts
interface Channel {
  send(event: string, ...args: Array<any>): Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  call<T>(channelName: T, methodName: string, args?: Array<any>): Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  addHandler<T, V>(channelName: T, callback: (value: V) => void): void;
}

type CustomApiMaker = (channel: Channel) => CustomApi;

// this is the "correct" type definition for the `init` function, as opposed to the "fake" type we define
// here https://github.com/contentful/ui-extensions-sdk/blob/v4.23.1/lib/index.ts#L8-L13 which masks
// the presence of the `makeCustomApi` option
type InitFunction = <T>(
  initCb: (sdk: KnownAppSDK, customSdk: T) => void,
  {
    makeCustomApi,
    supressIframeWarning,
  }: { makeCustomApi?: CustomApiMaker; supressIframeWarning?: boolean }
) => [KnownAppSDK, T] | void;

const init = sdkInit as InitFunction;

interface CustomSDKProviderProps {
  loading?: ReactElement;
}

// These methods must be defined on the "receiving" end in user interface / experience packages
export class CustomApi {
  constructor(private readonly channel: Channel) {}

  /**
   * Calling this method will trigger a save of the app config with the overlay
   * If the app is not yet installed, it will be installed, otherwise it will perform an update
   * @returns Promise<void>
   */
  async saveConfiguration(): Promise<void> {
    return this.channel.call('callAppMethod', 'save', []);
  }

  /**
   * Calling this method will trigger a save of the app config without the overlay
   * If the app is not yet installed, it will be installed, otherwise it will perform an update
   * @returns Promise<void>
   */
  async quickSaveConfiguration(): Promise<void> {
    return this.channel.call('callAppMethod', 'quickSave', []);
  }
}

const makeCustomApi: CustomApiMaker = (channel: Channel) => new CustomApi(channel);

// this context and the below provider is a reimplimentation of the SdkProvider that includes a customApi attribute, which is secretly
// supported by the App SDK. We will use it to expose the ability to self install to our app.
export const CustomApiContext = createContext<{
  customApi: CustomApi | null;
}>({ customApi: null });

export const SdkWithCustomApiProvider: FC<PropsWithChildren<CustomSDKProviderProps>> = (props) => {
  const [sdk, setSDK] = useState<KnownAppSDK | undefined>();
  const [customApi, setCustomApi] = useState<CustomApi | undefined>();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      console.warn(
        "Your app is taking longer than expected to initialize. If you think this is an error with Contentful's App SDK, let us know: https://github.com/contentful/ui-extensions-sdk/issues"
      );
    }, DELAY_TIMEOUT);
    init<CustomApi>(
      (sdk: KnownAppSDK, customApi: CustomApi) => {
        setSDK(sdk);
        setCustomApi(customApi);
        window.clearTimeout(timeout);
      },
      { makeCustomApi }
    );
    return () => window.clearTimeout(timeout);
  }, []);

  if (!sdk || !customApi) {
    if (props.loading) {
      return props.loading;
    }
    return null;
  }

  return (
    <CustomApiContext.Provider value={{ customApi }}>
      <SDKContext.Provider value={{ sdk }}>{props.children}</SDKContext.Provider>
    </CustomApiContext.Provider>
  );
};
