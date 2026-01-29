import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Box, Button, Card, Flex, Heading, Paragraph, Text } from '@contentful/f36-components';
import { CheckCircleIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import tokens from '@contentful/f36-tokens';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [isInstalled, setIsInstalled] = useState(false);

  const onConfigure = useCallback(async () => {
    return {
      parameters: {},
      targetState: {
        EditorInterface: {},
      },
    };
  }, []);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    const checkInstallation = async () => {
      const installed = await sdk.app.isInstalled();
      setIsInstalled(installed);
      sdk.app.setReady();
    };
    checkInstallation();
  }, [sdk]);

  // URL format: /spaces/{spaceId}/apps/app_installations/{appId}/{pagePath}
  const pageLocationUrl = `https://app.contentful.com/spaces/${sdk.ids.space}/apps/app_installations/${sdk.ids.app}/google-docs`;

  return (
    <Box
      paddingTop="spacing2Xl"
      paddingBottom="spacing2Xl"
      style={{ maxWidth: '550px', margin: '0 auto' }}>
      <Card padding="large">
        <Box marginBottom="spacingL">
          <Heading as="h1" marginBottom="spacingS">
            Google Docs Import
          </Heading>
          <Paragraph marginBottom="none" style={{ color: tokens.gray600 }}>
            Import content from Google Docs directly into Contentful. Connect your Google Drive,
            select a document, and let AI extract structured entries for your content types.
          </Paragraph>
        </Box>

        <Box
          marginBottom="spacingL"
          padding="spacingM"
          style={{
            backgroundColor: tokens.green100,
            borderRadius: tokens.borderRadiusMedium,
          }}>
          <Flex alignItems="center" gap="spacingS">
            <CheckCircleIcon variant="positive" />
            <Text fontColor="green700">
              <strong>No configuration required</strong> — this app is ready to use.
            </Text>
          </Flex>
        </Box>

        <Button
          variant="primary"
          size="large"
          as="a"
          href={isInstalled ? pageLocationUrl : undefined}
          target="_blank"
          isDisabled={!isInstalled}>
          {isInstalled ? 'Open the app' : 'Install the app first'}
        </Button>
      </Card>
    </Box>
  );
};

export default ConfigScreen;
