import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';

import { Flex } from '@contentful/f36-core';
import { Paragraph, Heading } from '@contentful/f36-typography';
import { FormControl, Select } from '@contentful/f36-forms';
import tokens from '@contentful/f36-tokens';

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
    boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
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

const Home = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters | null>(null);
  const [sdk, setSDK] = useState<AppExtensionSDK | null>(null);

  // AppSDK is designed to be run only on the client side,
  // therefore we wrap the import in a useEffect (which is
  // run only in the browser)
  useEffect(() => {
    import('@contentful/app-sdk').then(({ init }) => {
      init((sdk) => {
        setSDK(sdk as AppExtensionSDK);
      });
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (!sdk) {
        return;
      }

      const currentState = await sdk.app.getCurrentState();

      sdk.app.onConfigure(() => {
        return {
          parameters,
          targetState: currentState,
        };
      });
    })();
  }, [sdk, parameters]);

  useEffect(() => {
    (async () => {
      if (!sdk) {
        return;
      }

      const params: AppInstallationParameters | null = await sdk.app.getParameters();
      setParameters(params || defaultParams);

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
            name={'target-language'}
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

export default Home;
