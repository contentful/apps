import { BaseAppSDK } from '@contentful/app-sdk';
import { KeyValueMap } from 'contentful-management';

export const useInstallationParameters = (sdk: BaseAppSDK): KeyValueMap => {
  return sdk.parameters.installation;
};
