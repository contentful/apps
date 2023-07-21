import { AppInstallationParameters } from '@locations/ConfigScreen';
import { useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { KeyValueMap } from 'contentful-management/types';

/**
 * This hook is used to save the parameters of the app when the user clicks save
 * on the config screen.
 *
 * @param parameters the parameters to be saved
 * @returns void
 */
const useSaveConfigHandler = <InstallationParameters extends KeyValueMap>(
  parameters: InstallationParameters
) => {
  const sdk = useSDK<ConfigAppSDK>();

  const getCurrentState = async () => {
    const currentState = await sdk.app.getCurrentState();
    const trimmedParameterInputs = Object.fromEntries(
      Object.entries(parameters).map(([key, value]) => [key, value ?? value.trim()])
    ) as InstallationParameters;

    return {
      parameters: trimmedParameterInputs,
      targetState: currentState,
    };
  };

  const changeSaveConfigHandler = () => {
    const saveHandler = getCurrentState();
    sdk.app.onConfigure(() => saveHandler);
  };

  useEffect(() => {
    changeSaveConfigHandler();
  }, [parameters]);
};

export default useSaveConfigHandler;
