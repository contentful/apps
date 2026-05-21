import { BaseAppSDK } from '@contentful/app-sdk';
import { KeyValueMap } from 'contentful-management';
import { AppInstallationParameters } from '../utils/types';

const DEFAULT_PARAMETERS: AppInstallationParameters = {
  separator: '',
  rules: [],
};

export const useInstallationParameters = (sdk: BaseAppSDK): KeyValueMap => {
  return sdk.parameters.installation ?? DEFAULT_PARAMETERS;
};
