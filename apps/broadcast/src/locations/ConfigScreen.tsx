import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Checkbox,
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';

export interface AppInstallationParameters {
  elevenLabsApiKey?: string;
  voiceId?: string;
  generateAudioActionId?: string;
  useMockAi?: boolean;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    elevenLabsApiKey: '',
    voiceId: '',
    generateAudioActionId: '',
    useMockAi: false,
  });
  const sdk = useSDK<ConfigAppSDK>();
  /*
     To use the cma, access it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = sdk.cma;

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    if (!parameters.useMockAi && !parameters.elevenLabsApiKey) {
      sdk.notifier.error('Please provide an ElevenLabs API key or enable mock mode.');
      return false;
    }

    if (!parameters.voiceId) {
      sdk.notifier.error('Please provide a voice ID.');
      return false;
    }

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters({
          elevenLabsApiKey: currentParameters.elevenLabsApiKey || '',
          voiceId: currentParameters.voiceId || '',
          generateAudioActionId: currentParameters.generateAudioActionId || '',
          useMockAi: Boolean(currentParameters.useMockAi),
        });
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <Heading marginBottom="spacingS">Voice &amp; Video Studio</Heading>
        <Paragraph marginBottom="spacingXl">
          Configure your ElevenLabs credentials and audio generation settings.
        </Paragraph>

        <Box marginBottom="spacingXl">
          <FormControl isRequired isInvalid={!parameters.useMockAi && !parameters.elevenLabsApiKey}>
            <FormControl.Label>ElevenLabs API key</FormControl.Label>
            <TextInput
              id="elevenLabsApiKey"
              name="elevenLabsApiKey"
              type="password"
              value={parameters.elevenLabsApiKey}
              onChange={(event) =>
                setParameters({
                  ...parameters,
                  elevenLabsApiKey: event.target.value,
                })
              }
              isDisabled={parameters.useMockAi}
            />
            <FormControl.HelpText>
              Store this as a secret app installation parameter. Create or manage keys in
              ElevenLabs.
            </FormControl.HelpText>
            {!parameters.useMockAi && !parameters.elevenLabsApiKey && (
              <FormControl.ValidationMessage>
                Provide an API key or enable mock mode.
              </FormControl.ValidationMessage>
            )}
          </FormControl>
          <Box marginTop="spacingS">
            <TextLink
              href="https://elevenlabs.io/app/speech-synthesis"
              target="_blank"
              rel="noopener noreferrer"
              alignIcon="end"
              icon={<ExternalLinkIcon />}>
              Manage ElevenLabs keys
            </TextLink>
          </Box>
        </Box>

        <Box marginBottom="spacingXl">
          <FormControl isRequired isInvalid={!parameters.voiceId}>
            <FormControl.Label>Voice ID</FormControl.Label>
            <TextInput
              id="voiceId"
              name="voiceId"
              value={parameters.voiceId}
              onChange={(event) =>
                setParameters({
                  ...parameters,
                  voiceId: event.target.value,
                })
              }
            />
            {!parameters.voiceId && (
              <FormControl.ValidationMessage>Voice ID is required.</FormControl.ValidationMessage>
            )}
          </FormControl>
        </Box>

        <Box marginBottom="spacingXl">
          <FormControl>
            <FormControl.Label>Generate Audio action ID (optional)</FormControl.Label>
            <TextInput
              id="generateAudioActionId"
              name="generateAudioActionId"
              value={parameters.generateAudioActionId}
              onChange={(event) =>
                setParameters({
                  ...parameters,
                  generateAudioActionId: event.target.value,
                })
              }
              placeholder="Auto-resolve by action name if left empty"
            />
            <FormControl.HelpText>
              If set, the Sidebar will call this App Action directly. Otherwise it will look for an
              action named &quot;Generate Audio&quot;.
            </FormControl.HelpText>
          </FormControl>
        </Box>

        <Box marginBottom="spacingXl">
          <Checkbox
            isChecked={parameters.useMockAi}
            onChange={(event) =>
              setParameters({
                ...parameters,
                useMockAi: event.target.checked,
              })
            }>
            Use mock audio generator
          </Checkbox>
        </Box>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
