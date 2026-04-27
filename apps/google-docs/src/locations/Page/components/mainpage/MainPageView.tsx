import { ArrowRightIcon } from '@contentful/f36-icons';
import { Button, Card, Flex, Heading, Layout, Note, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { OAuthConnector } from './OAuthConnector';

interface MainPageViewProps {
  oauthToken: string;
  isOAuthConnected: boolean;
  isOAuthLoading: boolean;
  isOAuthBusy: boolean;
  onConnectGoogleDrive: () => Promise<void>;
  onDisconnectGoogleDrive: () => Promise<void>;
  onSelectFile: () => void;
}

export const MainPageView = ({
  oauthToken,
  isOAuthConnected,
  isOAuthLoading,
  isOAuthBusy,
  onConnectGoogleDrive,
  onDisconnectGoogleDrive,
  onSelectFile,
}: MainPageViewProps) => {
  return (
    <Layout.Body>
      <Flex
        flexDirection="column"
        gap="spacingXl"
        style={{ maxWidth: '900px', margin: `${tokens.spacingL} auto` }}>
        <Heading marginBottom="none">Google Drive Integration</Heading>
        <OAuthConnector
          isOAuthConnected={isOAuthConnected}
          isOAuthBusy={isOAuthBusy}
          onConnect={onConnectGoogleDrive}
          onDisconnect={onDisconnectGoogleDrive}
        />
        <Card padding="large">
          {!isOAuthLoading && !isOAuthConnected && (
            <Note variant="warning" style={{ marginBottom: tokens.spacingM }}>
              Please connect to Google Drive before selecting your file.
            </Note>
          )}
          <Flex
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap="spacingL">
            <Flex flexDirection="column" alignItems="flex-start">
              <Heading marginBottom="spacingS">Select your file</Heading>
              <Paragraph>
                Create entries using existing content types from a Google Drive file.
                <br />
                Get started by selecting the file you would like to use.
              </Paragraph>
            </Flex>

            <Flex flexDirection="row" alignItems="center" gap="spacingS">
              <Button
                variant="primary"
                size="medium"
                isDisabled={!oauthToken}
                onClick={onSelectFile}
                endIcon={<ArrowRightIcon />}>
                Select your file
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Layout.Body>
  );
};
