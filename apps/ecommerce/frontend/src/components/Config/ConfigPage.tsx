import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Box } from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { styles } from './ConfigPage.styles';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';
import { ProviderConfig } from 'types';
import fetchWithSignedRequest from 'helpers/signedRequests';
import ConfigBody from './ConfigBody';
import AppLogo from './AppLogo';

const ConfigPage = () => {
  const [parameters, setParameters] = useState<KeyValueMap>({});
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>({} as ProviderConfig);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();

  const sdk = useSDK<ConfigAppSDK>();
  const cma = useCMA();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  const getConfig = useCallback(
    async (baseUrl: string) => {
      const url = new URL(`${baseUrl}/config.json`);
      fetchWithSignedRequest(url, sdk.ids.app, cma, 'GET', {
        'X-Contentful-Data-Provider': sdk.parameters.instance.provider,
      })
        .then((res) => {
          if (res.status !== 200) {
            const error = `${res.status} - ${res.statusText}`;
            throw new Error(error);
          }

          return res.json();
        })
        .then((data) => setProviderConfig(data))
        .catch((error) => {
          setError(error);
        })
        .finally(() => setIsLoading(false));
    },
    [cma, sdk.ids.app, sdk.parameters.instance.provider]
  );

  useEffect(() => {
    (async () => {
      const currentParameters: KeyValueMap | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      const baseUrl = sdk.parameters.instance.baseUrl;
      if (baseUrl) {
        getConfig(baseUrl);
      }

      sdk.app.setReady();
    })();
  }, [sdk, getConfig]);

  const handleCredentialCheck = async (baseUrl: string) => {
    const url = new URL(`${baseUrl}/healthcheck`);
    fetchWithSignedRequest(url, sdk.ids.app, cma, 'POST', {
      'X-Contentful-Data-Provider': sdk.parameters.instance.provider,
      'x-contentful-shopify-shop': parameters.shopName,
      'x-contentful-shopify-token': parameters.storefrontAccessToken,
    })
      .then((res) => {
        if (res.status !== 200) {
          const error = `Error: ${res.status} - ${res.statusText}`;
          throw new Error(error);
        }

        return res.json();
      })
      .then((data) => sdk.notifier.success('Credentials connected successfully'))
      .catch((error) => sdk.notifier.error(error.message));
  };

  const handleParameterChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;

    setParameters({ ...parameters, [key]: value });
  };

  return (
    <>
      <Box
        className={styles.background(providerConfig.primaryColor ?? '')}
        testId="configPageBackground"
      />
      <ConfigBody
        baseUrl={sdk.parameters.instance.baseUrl}
        error={error}
        isLoading={isLoading}
        onCredentialCheck={handleCredentialCheck}
        onParameterChange={handleParameterChange}
        parameters={parameters}
        providerConfig={providerConfig}
      />
      <AppLogo error={error} isLoading={isLoading} logoUrl={providerConfig.logoUrl} />
    </>
  );
};

export default ConfigPage;
