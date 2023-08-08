import { AppInstallationParameters } from '@locations/ConfigScreen';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useCallback } from 'react';

/**
 * This hook is used to save the parameters of the app.
 *
 * @param parameters the parameters to be saved
 * @returns void
 */
const useSaveConfigHandler = (parameters: AppInstallationParameters) => {
  const sdk = useSDK<ConfigAppSDK>();

  const getCurrentState = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk.app]);

  const changeSaveConfigHandler = useCallback(() => {
    const saveHandler = getCurrentState();
    sdk.app.onConfigure(() => saveHandler);
  }, [getCurrentState, sdk.app]);

  useEffect(() => {
    changeSaveConfigHandler();
  }, [parameters, changeSaveConfigHandler]);
};

export default useSaveConfigHandler;
