import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigPage from '../components/config/ConfigPage/ConfigPage';

export interface AppInstallationParameters {
  apiKey?: string
}

interface ParameterError {
  isApiKeyValid: boolean
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [error, setError] = useState<ParameterError>({ isApiKeyValid: false })
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

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    if (Object.keys(error)) sdk.notifier.error('Invalid Api Key') // map the message

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleConfig = (updatedParams: AppInstallationParameters) => {
    if (!updatedParams.apiKey) {
      setError({ isApiKeyValid: false })
      return;
    };

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
