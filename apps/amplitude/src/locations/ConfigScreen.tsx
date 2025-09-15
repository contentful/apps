import { useCallback, useState, useEffect, ChangeEvent } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  FormControl,
  Heading,
  HelpText,
  Paragraph,
  Stack,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export interface AppInstallationParameters {
  amplitudeApiKey?: string;
  amplitudeSecretKey?: string;
  amplitudeProjectId?: string;
}

const ConfigScreen = () => {
  console.log('⚙️ Amplitude Config: Initializing configuration screen');
  
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [amplitudeApiKey, setAmplitudeApiKey] = useState<string>('');
  const [amplitudeSecretKey, setAmplitudeSecretKey] = useState<string>('');
  const [amplitudeProjectId, setAmplitudeProjectId] = useState<string>('');

  console.log('📊 Amplitude Config: Current parameters state:', parameters);

  const validateInputs = useCallback(() => {
    console.log('🔍 Amplitude Config: Validating configuration inputs...');
    
    const isApiKeyValid = amplitudeApiKey.trim().length > 0;
    const isSecretKeyValid = amplitudeSecretKey.trim().length > 0;
    const isProjectIdValid = amplitudeProjectId.trim().length > 0;
    
    console.log('✅ Amplitude Config: API Key valid:', isApiKeyValid);
    console.log('✅ Amplitude Config: Secret Key valid:', isSecretKeyValid);
    console.log('✅ Amplitude Config: Project ID valid:', isProjectIdValid);
    
    return isApiKeyValid && isSecretKeyValid && isProjectIdValid;
  }, [amplitudeApiKey, amplitudeSecretKey, amplitudeProjectId]);

  const onConfigure = useCallback(async () => {
    console.log('💾 Amplitude Config: Starting configuration save process...');
    
    const currentState = await sdk.app.getCurrentState();
    console.log('📋 Amplitude Config: Current app state retrieved:', currentState);

    if (!validateInputs()) {
      console.error('❌ Amplitude Config: Validation failed - missing required fields');
      sdk.notifier.error('Please provide all required Amplitude credentials.');
      return false;
    }

    const parametersToSave = {
      ...parameters,
      amplitudeApiKey,
      amplitudeSecretKey,
      amplitudeProjectId,
    };

    console.log('💾 Amplitude Config: Saving parameters:', {
      ...parametersToSave,
      amplitudeSecretKey: '[REDACTED]' // Don't log secret in production
    });

    setParameters(parametersToSave);

    console.log('✅ Amplitude Config: Configuration save completed successfully');
    
    return {
      parameters: parametersToSave,
      targetState: currentState,
    };
  }, [parameters, sdk, amplitudeApiKey, amplitudeSecretKey, amplitudeProjectId, validateInputs]);

  useEffect(() => {
    console.log('🔗 Amplitude Config: Setting up configuration callback');
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    console.log('🚀 Amplitude Config: Loading existing configuration parameters...');
    
    (async () => {
      try {
        const currentParameters = await sdk.app.getParameters();
        console.log('📥 Amplitude Config: Retrieved existing parameters:', currentParameters ? 'Found' : 'None');

        if (currentParameters) {
          setParameters(currentParameters);
          setAmplitudeApiKey(currentParameters.amplitudeApiKey || '');
          setAmplitudeSecretKey(currentParameters.amplitudeSecretKey || '');
          setAmplitudeProjectId(currentParameters.amplitudeProjectId || '');
          console.log('✅ Amplitude Config: Parameters loaded successfully');
        }

        sdk.app.setReady();
        console.log('🎯 Amplitude Config: App marked as ready for user interaction');
      } catch (error) {
        console.error('❌ Amplitude Config: Error loading parameters:', error);
      }
    })();
  }, [sdk]);

  const handleApiKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('📝 Amplitude Config: API Key updated, length:', newValue.length);
    setAmplitudeApiKey(newValue);
  };

  const handleSecretKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('📝 Amplitude Config: Secret Key updated, length:', newValue.length);
    setAmplitudeSecretKey(newValue);
  };

  const handleProjectIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('📝 Amplitude Config: Project ID updated:', newValue);
    setAmplitudeProjectId(newValue);
  };

  console.log('🎨 Amplitude Config: Rendering configuration screen');

  return (
    <Box padding="spacingL">
      <Box marginBottom="spacingL">
        <Heading>Set Up Amplitude Analytics</Heading>
        <Paragraph>
          Connect your Amplitude analytics to track and analyze user behavior in your Contentful entries.
          This integration allows you to send events and monitor content performance.
        </Paragraph>
      </Box>
      
      <Stack spacing="spacingL" flexDirection="column">
        <FormControl id="apiKey" isRequired={true}>
          <FormControl.Label aria-label="apiKey" htmlFor="apiKey">
            Amplitude API Key
          </FormControl.Label>
          <TextInput
            testId="apiKey"
            spellCheck={false}
            name="apiKey"
            placeholder="Enter your Amplitude API Key"
            value={amplitudeApiKey}
            onChange={handleApiKeyChange}
          />
          <HelpText>
            Find your API Key in the{' '}
            <TextLink
              icon={<ExternalLinkIcon />}
              alignIcon="end"
              href="https://amplitude.com/docs/apis/analytics/find-api-credentials"
              target="_blank"
              rel="noopener noreferrer">
              Amplitude dashboard
            </TextLink>
          </HelpText>
        </FormControl>

        <FormControl id="secretKey" isRequired={true}>
          <FormControl.Label aria-label="secretKey" htmlFor="secretKey">
            Amplitude Secret Key
          </FormControl.Label>
          <TextInput
            testId="secretKey"
            spellCheck={false}
            name="secretKey"
            type="password"
            placeholder="Enter your Amplitude Secret Key"
            value={amplitudeSecretKey}
            onChange={handleSecretKeyChange}
          />
          <HelpText>
            Keep your secret key secure and never share it publicly.
          </HelpText>
        </FormControl>

        <FormControl id="projectId" isRequired={true}>
          <FormControl.Label aria-label="projectId" htmlFor="projectId">
            Amplitude Project ID
          </FormControl.Label>
          <TextInput
            testId="projectId"
            spellCheck={false}
            name="projectId"
            placeholder="Enter your Amplitude Project ID"
            value={amplitudeProjectId}
            onChange={handleProjectIdChange}
          />
          <HelpText>
            The Project ID can be found in your Amplitude project settings.
          </HelpText>
        </FormControl>
      </Stack>
    </Box>
  );
};

export default ConfigScreen;
