import { useEffect, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  Select,
  Subheading,
  Text,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { CheckCircleIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { PROVIDER_CONFIGS, PROVIDER_OPTIONS } from '@configs/providers';
import { AppInstallationParameters, Provider } from '../types';

const CAPABILITIES = [
  'List and search entries or assets',
  'Create, update, publish, and delete entries',
  'Create and update content types',
  'Browse environments, locales, and tags',
  'Get information about your space',
];

const styles = {
  body: {
    height: 'auto',
    minHeight: '65vh',
    margin: `${tokens.spacingXl} auto`,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: '900px',
    backgroundColor: tokens.colorWhite,
    borderRadius: '6px',
    border: `1px solid ${tokens.gray300}`,
  },
  splitter: {
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  },
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();

  const [provider, setProvider] = useState<Provider>('anthropic');
  const [modelId, setModelId] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  useEffect(() => {
    sdk.app.onConfigure(async () => {
      const parameters: AppInstallationParameters = {
        provider,
        modelId: modelId || PROVIDER_CONFIGS[provider].defaultModel,
        ...credentials,
      };
      return { parameters };
    });
  }, [sdk, provider, modelId, credentials]);

  useEffect(() => {
    (async () => {
      const saved = (await sdk.app.getParameters()) as AppInstallationParameters | null;
      if (saved) {
        if (saved.provider) setProvider(saved.provider);
        if (saved.modelId) setModelId(saved.modelId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { provider: _provider, modelId: _modelId, ...creds } = saved;
        setCredentials(creds as Record<string, string>);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setModelId('');
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const config = PROVIDER_CONFIGS[provider];

  return (
    <div style={styles.body}>
      <Heading>Contentful Copilot</Heading>

      <hr style={styles.splitter} />

      {/* Provider & credentials */}
      <Flex flexDirection="column" alignItems="flex-start" fullWidth>
        <Subheading>AI provider configuration</Subheading>
        <Paragraph>
          Choose your preferred LLM provider and enter your credentials. Your API key is stored as
          a secret installation parameter and is never exposed to other users.
        </Paragraph>
        <Form style={{ width: '100%', maxWidth: '480px' }}>
          <FormControl isRequired>
            <FormControl.Label>Provider</FormControl.Label>
            <Select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}>
              {PROVIDER_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormControl.Label>Model</FormControl.Label>
            <TextInput
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder={config.modelPlaceholder}
            />
            <FormControl.HelpText>
              Leave blank to use the default:{' '}
              <Text as="span" fontWeight="fontWeightMedium">
                {config.defaultModel}
              </Text>
            </FormControl.HelpText>
          </FormControl>

          {config.credentialFields.map((field) => (
            <FormControl key={field.key} isRequired>
              <FormControl.Label>{field.label}</FormControl.Label>
              <TextInput
                value={(credentials[field.key] as string) ?? ''}
                onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                type={field.type}
                placeholder={field.placeholder}
              />
              {field.helpText && (
                <FormControl.HelpText>{field.helpText}</FormControl.HelpText>
              )}
            </FormControl>
          ))}
        </Form>
      </Flex>

      <hr style={styles.splitter} />

      {/* Capabilities */}
      <Flex flexDirection="column" alignItems="flex-start" fullWidth>
        <Subheading>What Contentful Copilot can do</Subheading>
        <Paragraph>
          Once installed, open the app from the left navigation to start chatting. You can ask the
          copilot to:
        </Paragraph>
        <Flex flexDirection="column" gap="spacingXs" alignItems="flex-start">
          {CAPABILITIES.map((item) => (
            <Flex key={item} alignItems="center" gap="spacingXs">
              <CheckCircleIcon variant="positive" size="small" />
              <Text fontSize="fontSizeM">{item}</Text>
            </Flex>
          ))}
        </Flex>
        <Paragraph marginTop="spacingM" marginBottom="none">
          <TextLink
            href="https://www.contentful.com/developers/docs/tools/mcp-server/"
            target="_blank"
            rel="noopener noreferrer">
            Learn more about Contentful&apos;s AI capabilities
          </TextLink>
        </Paragraph>
      </Flex>
    </div>
  );
};

export default ConfigScreen;
