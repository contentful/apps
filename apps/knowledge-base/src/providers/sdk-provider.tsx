import * as React from 'react';
import {
  AppExtensionSDK,
  SidebarExtensionSDK,
} from 'contentful-ui-extensions-sdk';
import { RateLimit } from 'async-sema';

interface SdkContextProps {
  getContentType?: (id: string) => Promise<Record<string, any>>;
  updateContentType?: (
    contentType: Record<string, any>
  ) => Promise<Record<string, any>>;
  createContentType?: (
    contentType: Record<string, any>
  ) => Promise<Record<string, any>>;
  getEntry?: (id: string) => Promise<Record<string, any>>;
  publishEntry?: (entry: Record<string, any>) => Promise<Record<string, any>>;
  createEntry?: (
    entryId: string,
    entryData: Record<string, any>
  ) => Promise<any>;
  getAsset?: (id: string) => Promise<Record<string, any>>;
  publishAsset?: (asset: Record<string, any>) => Promise<Record<string, any>>;
  createAsset?: (asset: Record<string, any>) => Promise<Record<string, any>>;
  processAsset?: (
    asset: Record<string, any>,
    locale: string
  ) => Promise<Record<string, any>>;
  prepareAsset?: (
    asset: Record<string, any>,
    locale: string
  ) => Record<string, any>;
  waitUntilAssetProcessed?: (asset: Record<string, any>, locale: string) => any;
  instance?: AppExtensionSDK & SidebarExtensionSDK;
}

interface SdkProviderProps {
  sdk: AppExtensionSDK & SidebarExtensionSDK;
}

const { createContext, useContext } = React;

const SdkContext = createContext<SdkContextProps>({});

const waitForRateLimit = RateLimit(8); // rate limit is 10/s, using 8 just to compensate any latency

export const SdkProvider: React.FC<SdkProviderProps> = (props) => {
  const transformedSpaceMethods = [
    'getContentType',
    'updateContentType',
    'createContentType',
    'createContentType',
    'getEntry',
    'publishEntry',
    'createEntry',
    'getAsset',
    'publishAsset',
    'createAsset',
    'processAsset',
    'waitUntilAssetProcessed',
  ].reduce((list, method) => {
    list[method] = async function (...params) {
      await waitForRateLimit();

      return props.sdk.space[method](...params);
    };

    return list;
  }, {});

  function prepareAsset(asset, locale) {
    return {
      sys: {
        id: asset.sys.id,
      },
      fields: {
        ...asset.fields,
        file: {
          [locale]: {
            fileName: asset.fields.file[locale].fileName,
            contentType: asset.fields.file[locale].contentType,
            upload: `https:${asset.fields.file[locale].url}`,
          },
        },
      },
    };
  }

  return (
    <SdkContext.Provider
      value={{
        ...transformedSpaceMethods,
        prepareAsset,
        instance: props.sdk,
      }}
    >
      {props.children}
    </SdkContext.Provider>
  );
};

export const useSdk = (): SdkContextProps => {
  return useContext(SdkContext);
};
