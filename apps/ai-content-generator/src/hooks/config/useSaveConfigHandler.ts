import { AppInstallationParameters } from '@/components/config/ConfigForm';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect } from 'react';

const useSaveConfigHandler = (parameters: AppInstallationParameters) => {
  const sdk = useSDK<ConfigAppSDK>();

  const getCurrentState = async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
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
