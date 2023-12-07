import type { KnownSDK } from '@contentful/app-sdk';

export type SdkState = {
  sdk: KnownSDK | undefined;
  setSdk: (sdk: KnownSDK) => void;
};
