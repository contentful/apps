import { BaseAppSDK } from '@contentful/app-sdk/dist/types/api.types';
import { WindowAPI } from '@contentful/app-sdk';

// https://github.com/contentful/ui-extensions-sdk/blob/main/lib/types/window.types.ts
declare global {
  interface Window extends WindowAPI {
    __SDK__: BaseAppSDK & { window: WindowAPI };
  }
}
