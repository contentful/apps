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

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    targetLanguage: 'mandalorian',
  });
  const sdk = useSDK<AppExtensionSDK>();

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

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

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
