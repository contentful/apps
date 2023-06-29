import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect } from 'react';
import { AppInstallationParameters } from '../ConfigForm';

const useSaveConfigHandler = (parameters: AppInstallationParameters) => {
  const sdk = useSDK<ConfigAppSDK>();

  const handleConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  const setupConfigHandler = () => sdk.app.onConfigure(() => handleConfigure());

  useEffect(setupConfigHandler, [handleConfigure]);
};

export default useSaveConfigHandler;
