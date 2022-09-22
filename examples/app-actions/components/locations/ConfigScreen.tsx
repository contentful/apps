import React, { useCallback, useEffect, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';
import { Flex, FormControl, Heading, Paragraph, Select } from '@contentful/f36-components';
import { AppExtensionSDK } from '@contentful/app-sdk';

const styles = {
  body: css({
    height: 'auto',
    minHeight: '65vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: tokens.contentWidthText,
    backgroundColor: tokens.colorWhite,
    zIndex: 2,
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '2px',
  }),
  background: css({
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    top: 0,
    width: '100%',
    height: '300px',
    backgroundColor: tokens.green400,
  }),
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  }),
};

interface AppInstallationParameters {
  targetLanguage: string;
}

const defaultParams = {
  targetLanguage: 'mandalorian',
};

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters | null>(null);
  const sdk = useSDK<AppExtensionSDK>();
  // const [sdk, setSDK] = useState<AppExtensionSDK | null>(null);

  // AppSDK is designed to be run only on the client side,
  // therefore we wrap the import in a useEffect (which is
  // run only in the browser)
  // useEffect(() => {
  //   import('@contentful/app-sdk').then(({ init }) => {
  //     init((sdk) => {
  //       setSDK(sdk as AppExtensionSDK);
  //     });
  //   });
  // }, []);

  // useEffect(() => {
  //   (async () => {
  //     if (!sdk) {
  //       return;
  //     }

  //     const currentState = await sdk.app.getCurrentState();

  //     sdk.app.onConfigure(() => {
  //       return {
  //         parameters,
  //         targetState: currentState,
  //       };
  //     });
  //   })();
  // }, [sdk, parameters]);

  // useEffect(() => {
  //   (async () => {
  //     if (!sdk) {
  //       return;
  //     }

  //     const params: AppInstallationParameters | null = await sdk.app.getParameters();
  //     setParameters(params || defaultParams);

  //     sdk.app.setReady();
  //   })();
  // }, [sdk]);

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
    <>
      <div className={styles.background} />
      <div className={styles.body}>
        <Heading>About Star Wars Translations</Heading>
        <Paragraph>
          Translate entries fields from English (locale: <code>en</code>) to selected Star Wars
          Language
        </Paragraph>
        <hr className={styles.splitter} />

        <Heading>Configuration</Heading>

        <FormControl id="target-language">
          <FormControl.Label>Language</FormControl.Label>
          <Select
            id="target-language"
            name="target-language"
            value={parameters?.targetLanguage}
            onChange={(e) => setParameters({ targetLanguage: e.target.value })}
          >
            <Select.Option value="mandalorian">Mandalorian</Select.Option>
            <Select.Option value="sith">Sith</Select.Option>
            <Select.Option value="yoda">Yoda</Select.Option>
          </Select>
          <Flex justifyContent="space-between">
            <FormControl.HelpText>
              Select the language you want the <code>title</code> field of your entry to be
              translated to
            </FormControl.HelpText>
          </Flex>
        </FormControl>
      </div>
    </>
  );
};

export default ConfigScreen;
