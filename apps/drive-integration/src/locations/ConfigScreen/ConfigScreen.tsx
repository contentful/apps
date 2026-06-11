import { useEffect, useCallback } from 'react';
import { Box, Flex, Heading, Paragraph, Text, TextLink } from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
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
  disclosure: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingL,
    width: '100%',
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
            Drive Integration
          </Heading>
          <Paragraph>
            Connect Drive Integration to Contentful to seamlessly sync content, eliminate
            copy-paste, reduce errors, and speed up your publishing workflow.
          </Paragraph>
        </Box>
        <Box className={styles.disclosure}>
          <Text>
            <Text fontWeight="fontWeightDemiBold">Disclosure:</Text> The use and transfer of raw or
            derived user data received from Google Workspace APIs will adhere to the{' '}
            <TextLink
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              icon={<ArrowSquareOutIcon />}
              alignIcon="end">
              Google API Services User Data Policy
            </TextLink>
            , including the Limited Use requirements.
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
