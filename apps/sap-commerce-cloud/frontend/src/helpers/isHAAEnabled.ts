import { BaseAppSDK } from '@contentful/app-sdk';
import { getAppIds } from './getAppIds';

export const isHAAEnabled = (ids: BaseAppSDK['ids']) => {
  const appIds = getAppIds();
  return appIds.sapAirAppId.includes(ids.app!);
};
