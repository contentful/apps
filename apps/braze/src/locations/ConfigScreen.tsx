import { ConfigAppSDK } from '@contentful/app-sdk';
import { Box, Flex, Form, FormControl, Heading, Paragraph, Subheading, TextInput, TextLink } from '@contentful/f36-components';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { styles } from './ConfigScreen.styles';
import Splitter from '../components/Splitter';


export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [value, setValue] = useState('');
  const sdk = useSDK<ConfigAppSDK>();
  const spaceId = sdk.ids.space

  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

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
    <Flex justifyContent='center' alignContent='center' >
    <Box className={styles.body} marginTop="spacingL" padding ="spacingL" >     
        <Heading marginBottom='spacingS'>Set up Braze</Heading>
        <Paragraph marginBottom='spacing2Xs'>The Braze app allows editors to connect content stored in Contentful to Braze campaigns through </Paragraph>
        <TextLink
        icon={<ExternalLinkIcon />}
        alignIcon="end"
        href="https://braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content"
        target="_blank"
        rel="noopener noreferrer"
      >
        Braze's Connected Content feature
      </TextLink>
      <Splitter marginTop='spacingL' marginBottom='spacingL'/>
      <Subheading className={styles.subheading}>Connected Content configuration</Subheading>
      <Paragraph marginBottom='spacing2Xs'> Select the Contentful API key that Braze will use to request your content via API at send time.
      </Paragraph>
      <TextLink
        icon={<ExternalLinkIcon />}
        alignIcon="end"
        href={`https://app.contentful.com/spaces/${spaceId}/api/keys`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Manage API
      </TextLink>
      <Box marginTop='spacingM'>
      <Form>
      <FormControl.Label>Select Contentful API key</FormControl.Label>
      <TextInput
        value={value}
        type="apiKey"
        name="apiKey"
        placeholder="Content Delivery API - access token"
        onChange={(e) => setValue(e.target.value)}
      />
      </Form>
      </Box>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
