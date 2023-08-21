import { AppInstallationParameters } from '@locations/ConfigScreen';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useCallback } from 'react';

/**
 * This hook is used to save the parameters of the app.
 *
 * @param parameters the parameters to be saved
 * @param validateParams function to handle any parameter validations and returns an array of error messages
 * @returns void
 */
const useSaveConfigHandler = (
  parameters: AppInstallationParameters,
  validateParams: (params: AppInstallationParameters) => string[]
) => {
  const sdk = useSDK<ConfigAppSDK>();

  const getCurrentState = useCallback(async () => {
    const notifierErrors = validateParams(parameters);

    if (notifierErrors.length) {
      notifierErrors.forEach((error) => sdk.notifier.error(error));
      return false;
    }

    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk.app, sdk.notifier, validateParams]);

  const changeSaveConfigHandler = useCallback(() => {
    sdk.app.onConfigure(() => getCurrentState());
  }, [getCurrentState, sdk.app]);

  useEffect(() => {
    changeSaveConfigHandler();
  }, [parameters, changeSaveConfigHandler]);
};

export default useSaveConfigHandler;
