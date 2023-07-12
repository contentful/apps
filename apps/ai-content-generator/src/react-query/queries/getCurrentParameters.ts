import { AppInstallationParameters } from '@/components/config/ConfigForm';
import { ConfigAppSDK } from '@contentful/app-sdk';

const getCurrentParameters = (sdk: ConfigAppSDK) => {
  return async () => {
    const currentParameters = await sdk.app.getParameters<AppInstallationParameters>();
    return currentParameters;
  };
};

export default getCurrentParameters;
