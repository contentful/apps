import type { KnownSDK } from '@contentful/app-sdk';
import { CustomAPI } from './analytics';

export type SdkState = {
  sdk: KnownSDK | undefined;
  setSdk: (sdk: KnownSDK) => void;
};

export type InternalSdkState = {
  internalSdk: CustomAPI | undefined;
  setInternalSdk: (internalSdk: CustomAPI) => void;
};
