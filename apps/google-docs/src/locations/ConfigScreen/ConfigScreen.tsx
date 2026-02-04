import { useEffect, useCallback } from 'react';
import { Box, Flex, Heading, Paragraph, Note, Text } from '@contentful/f36-components';
import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';

const styles = {
  body: css({
    maxWidth: '900px',
    alignSelf: 'stretch',
  }),
  heading: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters: {},
      targetState: currentState,
    };
  }, [sdk]);

  useEffect(() => {
    sdk.app.onConfigure(async () => {
      const result = await onConfigure();

      // Redirect to Page location after successful configuration
      // Using setTimeout to allow the configuration to be saved first
      setTimeout(() => {
        sdk.navigator.openCurrentAppPage();
      }, 500);

      return result;
    });

    // Mark app as ready
    sdk.app.setReady();
  }, [sdk, onConfigure]);

  return (
    <Flex justifyContent="center" alignItems="flex-start">
      <Flex
        flexDirection="column"
        alignItems="flex-start"
        gap="spacingXl"
        padding="spacingL"
        marginTop="spacing2Xl"
        marginBottom="spacingL"
        className={styles.body}>
        <Box>
          <Heading className={styles.heading} marginBottom="spacingS">
            Google Drive app
          </Heading>
          <Paragraph>
            Connect Google Drive to Contentful to seamlessly sync content, eliminate copy-paste,
            reduce errors, and speed up your publishing workflow.
          </Paragraph>
        </Box>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
