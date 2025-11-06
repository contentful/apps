import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Paragraph,
  Flex,
  FormControl,
  TextInput,
  Note,
} from '@contentful/f36-components';
import { css } from 'emotion';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';

export interface AppInstallationParameters {
  githubModelsApiKey?: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Validate that API key is provided
    if (!parameters.githubModelsApiKey || parameters.githubModelsApiKey.trim() === '') {
      sdk.notifier.error('Please provide a GitHub Models API key');
      return false;
    }

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

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
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <Heading>Richard Brandson - Brand Guidelines Generator</Heading>
        <Paragraph>
          Configure your AI-powered brand guidelines generator. This app uses GitHub Models to analyze
          your content and generate comprehensive brand guidelines including tone, style, and
          messaging recommendations.
        </Paragraph>

        <FormControl isRequired>
          <FormControl.Label>GitHub Personal Access Token</FormControl.Label>
          <TextInput
            value={parameters.githubModelsApiKey || ''}
            type="password"
            placeholder="github_pat_..."
            onChange={(e) =>
              setParameters({ ...parameters, githubModelsApiKey: e.target.value })
            }
          />
          <FormControl.HelpText>
            A GitHub Personal Access Token with <code>models:read</code> scope is required to generate 
            AI-powered brand guidelines. Get your token from{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Settings → Developer settings → Personal access tokens
            </a>
            .
          </FormControl.HelpText>
        </FormControl>

        <Note variant="primary" title="How it works" style={{ marginTop: '20px' }}>
          Once configured, the app will:
          <ul>
            <li>Analyze all content in your space (entries, assets, content types)</li>
            <li>Use GitHub Models AI to identify brand voice, tone, and messaging patterns</li>
            <li>Generate a comprehensive brand guidelines PDF</li>
            <li>Include style recommendations based on your actual content</li>
          </ul>
        </Note>

        <Note variant="warning" title="Privacy & Security" style={{ marginTop: '20px' }}>
          Your GitHub token is stored securely in Contentful's app configuration. Content from your
          space will be sent to GitHub Models API for analysis. GitHub Models provides access to
          various AI models including OpenAI, Meta, and Microsoft models.
        </Note>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
