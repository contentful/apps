import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigPage from '../components/config/ConfigPage/ConfigPage';

export interface AppInstallationParameters {
  apiKey?: string
}

const errorMessages = {
  apiKeyEmpty: 'API key is required.',
  apiKeyInvalid: 'API key is not valid'
}

type InstallErrors = 'apiKeyEmpty' | 'apiKeyInvalid'


const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  useEffect(() => {
    const getAppActions = async () => {
      const appActions = await sdk.cma.appAction.getMany({
        appDefinitionId: sdk.ids.app,
        limit: 100,
      });
      console.log('appActions', appActions);
    };

    getAppActions();
  }, [sdk.cma.appAction, sdk.ids.app]);

  const handleError = (errorType: InstallErrors) => {
    sdk.notifier.error(errorMessages[errorType])
  }

  const handleInstall = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    if (!parameters.apiKey) {
      handleError('apiKeyEmpty')
      return false;
    }

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => handleInstall());
  }, [sdk, handleInstall]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleConfig = (updatedParams: AppInstallationParameters) => {
    setParameters((prevParameters) => ({
      ...prevParameters,
      ...updatedParams
    }))
  }

  return (
    <ConfigPage parameters={parameters} handleConfig={handleConfig} />
  );
};

export default ConfigScreen;
