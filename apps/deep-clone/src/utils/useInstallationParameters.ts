import { BaseAppSDK } from '@contentful/app-sdk';
import { KeyValueMap } from 'contentful-management';

const DEFAULTS: KeyValueMap = {
  cloneText: 'Copy',
  cloneTextBefore: true,
  automaticRedirect: true,
};

export const useInstallationParameters = (sdk: BaseAppSDK): KeyValueMap => {
  const params = sdk.parameters.installation;
  if (!params || Object.keys(params).length === 0) {
    return DEFAULTS;
  }
  return params;
};
