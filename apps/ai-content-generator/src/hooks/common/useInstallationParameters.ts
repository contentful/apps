import { BaseAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  AppInstallationParameters,
  AppInstallationParametersV1,
  AppInstallationParametersV2,
} from '@locations/ConfigScreen';
import { mapV1ParamsToV2 } from '@utils/config/parameterHelpers';

/**
 * Use this instead of sdk.parameters.installation!
 *
 * This hook is used to get the installation parameters of the app.
 * It will get the parameters and migrate them to the latest version as needed.
 *
 * @returns AppInstallationParameters
 */
const useInstallationParameters = (): AppInstallationParameters => {
  const sdk = useSDK();

  const migrateParameters = (sdk: BaseAppSDK) => {
    const parameters = sdk.parameters.installation;

    switch (parameters.version) {
      case 2: {
        return { ...parameters } as AppInstallationParametersV2;
      }
      // Migrate from V1 to current version (V1 lacks version property)
      default: {
        const newParameters = mapV1ParamsToV2(parameters as AppInstallationParametersV1);
        return { ...newParameters };
      }
    }
  };

  return migrateParameters(sdk);
};

export default useInstallationParameters;
