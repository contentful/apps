import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import fetchWithSignedRequest from 'helpers/signedRequests';

export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();
  const cma = useCMA();
  const [isInstalled, setIsInstalled] = useState<Boolean>(false);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    setIsInstalled(true);

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

      if (currentParameters) setParameters(currentParameters);

      sdk.app.setReady();
    })();
  }, [sdk]);

  const ping = async () => {
    const url = new URL(`http://localhost:8080/dev/api/ping`);
    fetchWithSignedRequest(url, sdk.ids.app, cma, 'GET', {
      'X-Contentful-Data-Provider': sdk.parameters.instance.provider,
    })
      .then((res) => {
        if (res.status !== 200) {
          const error = `Error: ${res.status} – ${res.statusText}`;
          sdk.notifier.error(error);
          throw new Error(error);
        }

        return res.json();
      })
      .then((data) => sdk.notifier.success(data.message))
      .catch((error) => sdk.notifier.error(error.message));
  };

  useEffect(() => {
    sdk.app.isInstalled().then((isInstalled) => setIsInstalled(isInstalled));
  }, [sdk.app]);

  if (isInstalled) {
    return <Button onClick={() => ping()}>Ping</Button>;
  } else {
    return <h1>Click "Install" button above</h1>;
  }
};

export default ConfigScreen;
