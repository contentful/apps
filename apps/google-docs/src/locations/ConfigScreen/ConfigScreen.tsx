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
  note: css({
    padding: tokens.spacingM,
    gap: tokens.spacingS,
    alignSelf: 'stretch',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.blue300}`,
    background: tokens.blue100,
  }),
  codeBlock: css({
    // Code block <pre> element requires full custom styling
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: tokens.spacingS,
    gap: tokens.spacing2Xs,
    alignSelf: 'stretch',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.gray300}`,
    background: tokens.gray100,
    fontFamily: tokens.fontStackMonospace,
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightNormal,
    lineHeight: tokens.lineHeightM,
    whiteSpace: 'pre-wrap',
    color: tokens.gray900,
    margin: 0,
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
        <Note variant="primary" title="Optimization tip" className={styles.note}>
          <Flex flexDirection="column" alignItems="flex-start" gap="spacingM" fullWidth>
            <Paragraph>
              Use context markers in your document to exclude content that shouldn't be added to an
              entry. The AI looks for these markers during extraction and ignores any content
              between them.
            </Paragraph>
            <Box>
              <Text
                fontColor="gray900"
                fontSize="fontSizeS"
                fontWeight="fontWeightMedium"
                lineHeight="lineHeightS"
                marginBottom="spacing2Xs"
                as="p">
                Example
              </Text>
              <pre className={styles.codeBlock}>
                <code>{`[[CTX]]
This content is an internal note in the document and should not be added to an entry.
[[/CTX]]`}</code>
              </pre>
            </Box>
          </Flex>
        </Note>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
