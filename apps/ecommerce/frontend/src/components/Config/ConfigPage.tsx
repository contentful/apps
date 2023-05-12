import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Heading,
  Paragraph,
  Form,
  FormControl,
  Flex,
  TextInput,
  Skeleton,
} from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { styles } from './ConfigPage.styles';
import { ParameterDefinition, ProviderConfig } from 'types';
import fetchWithSignedRequest from 'helpers/signedRequests';

export interface AppInstallationParameters {
  [key: string]: any;
}

const ConfigPage = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>({} as ProviderConfig);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      const url = new URL(`${baseUrl}/config`);
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
        .then((data) => setProviderConfig(data))
        .catch((error) => sdk.notifier.error(error.message))
        .finally(() => setIsLoading(false));
    },
    [cma, sdk.ids.app, sdk.notifier, sdk.parameters.instance.provider]
  );

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

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

  const checkCredentials = async (baseUrl: string) => {
    const url = new URL(`${baseUrl}/healthcheck`);
    fetchWithSignedRequest(
      url,
      sdk.ids.app,
      cma,
      'POST',
      {
        'X-Contentful-Data-Provider': sdk.parameters.instance.provider,
      },
      { domain: parameters.apiEndpoint, storefrontAccessToken: parameters.storefrontAccessToken }
    )
      .then((res) => {
        if (res.status !== 200) {
          const error = `Error: ${res.status} – ${res.statusText}`;
          sdk.notifier.error(error);
          throw new Error(error);
        }

        return res.json();
      })
      .then((data) => sdk.notifier.success('Credentials connected successfully'))
      .catch((error) => sdk.notifier.error(error.message));
  };

  const onParameterChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;

    setParameters({ ...parameters, [key]: value });
  };

  const loadingSkeleton = () => {
    return (
      <Skeleton.Container>
        <Skeleton.BodyText numberOfLines={4} />
      </Skeleton.Container>
    );
  };

  return (
    <>
      <Box className={styles.background} testId="configPageContainer" />
      <Box className={styles.body}>
        {isLoading ? (
          loadingSkeleton()
        ) : (
          <>
            <Heading>About {providerConfig.name}</Heading>
            <Paragraph>{providerConfig.description}</Paragraph>
            <hr className={styles.splitter} />
            <Heading>Configuration</Heading>
            <Form>
              {providerConfig.parameterDefinitions &&
                providerConfig.parameterDefinitions.map((def: ParameterDefinition) => {
                  const key = `config-input-${def.id}`;

                  return (
                    <FormControl key={key} id={key}>
                      <FormControl.Label>{def.name}</FormControl.Label>
                      <TextInput
                        name={key}
                        width={def.type === 'Symbol' ? 'large' : 'medium'}
                        type={def.type === 'Symbol' ? 'text' : 'number'}
                        maxLength={255}
                        isRequired={def.required}
                        value={parameters?.[def.id] ?? ''}
                        onChange={onParameterChange.bind(this, def.id)}
                      />
                      <Flex justifyContent="space-between">
                        <FormControl.HelpText>{def.description}</FormControl.HelpText>
                        <FormControl.Counter />
                      </Flex>
                    </FormControl>
                  );
                })}
            </Form>
            {Object.keys(parameters).length ? (
              <Button onClick={() => checkCredentials(sdk.parameters.instance.baseUrl)}>
                Check Credentials
              </Button>
            ) : null}
          </>
        )}
      </Box>
    </>
  );
};

export default ConfigPage;
