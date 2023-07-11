import React, { useCallback, useState, useEffect } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  Select,
} from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';

// Stores config options
export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<AppExtensionSDK>();
  const [reactJsonConfig, setReactJsonConfig] = useState({
    displayDataTypes: 'false',
    iconStyle: 'triangle',
    collapsed: 'false',
    theme: 'rjv-default',
  });

  const onChangeHandler = (event: any) => {
    // Handles changes to the configuration form fields.
    const value = event.target.value;
    setReactJsonConfig({
      ...reactJsonConfig,
      [event.target.name]: value,
    });
  };

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
      const currentParameters = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters(currentParameters);
        setReactJsonConfig(currentParameters.configOptions);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  useEffect(() => {
    setParameters({ ...parameters, configOptions: reactJsonConfig });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactJsonConfig]);

  return (
    <Flex justifyContent="center">
      <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
        <Form>
          <Heading>JSON Viewer Configuration</Heading>
          <Paragraph>
            Optionally configure how the JSON Viewer looks and behaves. Based on the Props defined
            for the{' '}
            <a href="https://www.npmjs.com/package/react-json-view" target="blank">
              react-json-view
            </a>{' '}
            package.
          </Paragraph>

          <Box marginTop="spacingM">
            <FormControl.Label>Theme:</FormControl.Label>
            <Select
              id="theme"
              name="theme"
              value={reactJsonConfig.theme}
              onChange={onChangeHandler}>
              <Select.Option value={'rjv-default'}>Default</Select.Option>
              <Select.Option value={'grayscale:inverted'}>Grayscale: Inverted</Select.Option>
              <Select.Option value={'monokai'}>Monokai</Select.Option>
              <Select.Option value={'summerfruit'}>Summerfruit</Select.Option>
            </Select>
            <FormControl.HelpText>
              Check out the list of{' '}
              <a href="https://mac-s-g.github.io/react-json-view/demo/dist/" target="blank">
                supported themes
              </a>
            </FormControl.HelpText>
          </Box>

          <Box marginTop="spacingM">
            <FormControl.Label>Icon Style:</FormControl.Label>
            <Select
              id="iconStyle"
              name="iconStyle"
              value={reactJsonConfig.iconStyle}
              onChange={onChangeHandler}>
              <Select.Option value={'triangle'}>Triangle</Select.Option>
              <Select.Option value={'circle'}>Circle</Select.Option>
              <Select.Option value={'square'}>Square</Select.Option>
            </Select>
            <FormControl.HelpText>Style of expand/collapse icons</FormControl.HelpText>
          </Box>

          <Box marginTop="spacingM">
            <FormControl.Label>Display Data Types:</FormControl.Label>
            <Select
              id="displayDataTypes"
              name="displayDataTypes"
              value={reactJsonConfig.displayDataTypes}
              onChange={onChangeHandler}>
              <Select.Option value={'false'}>False</Select.Option>
              <Select.Option value={'true'}>True</Select.Option>
            </Select>
            <FormControl.HelpText>
              When set to true, data type labels prefix values
            </FormControl.HelpText>
          </Box>

          <Box marginTop="spacingM">
            <FormControl.Label>Collapsed:</FormControl.Label>
            <Select
              id="collapsed"
              name="collapsed"
              value={reactJsonConfig.collapsed}
              onChange={onChangeHandler}>
              <Select.Option value={'false'}>False</Select.Option>
              <Select.Option value={'true'}>True</Select.Option>
            </Select>
            <FormControl.HelpText>
              When set to true, all nodes will be collapsed by default
            </FormControl.HelpText>
          </Box>
        </Form>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
