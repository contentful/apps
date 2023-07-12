import { ConfigAppSDK } from '@contentful/app-sdk';
import type { KeyValueMap } from 'contentful-management';

const getCurrentParameters = <InstallationParameters extends KeyValueMap>(sdk: ConfigAppSDK) => {
  return async () => {
    const currentParameters = await sdk.app.getParameters<InstallationParameters>();
    return currentParameters;
  };
};

export default getCurrentParameters;
