import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import ConfigPage from 'components/config/ConfigPage/ConfigPage';
import { configPageErrorMessages } from 'constants/errorMessages';
import { AppInstallationParameters, InstallErrors } from 'types/configPage';

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

  const handleInstall = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const handleError = (errorType: InstallErrors) => {
      sdk.notifier.error(configPageErrorMessages[errorType]);
    };

    if (!parameters.apiKey) {
      handleError('apiKeyEmpty');
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
      ...updatedParams,
    }));
  };

  return <ConfigPage parameters={parameters} handleConfig={handleConfig} sdk={sdk} />;
};

export default ConfigScreen;
