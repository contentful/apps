import { ArrowRightIcon } from '@contentful/f36-icons';
import {
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Layout,
  Note,
  Paragraph,
} from '@contentful/f36-components';
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
          <Flex
            flexDirection="column"
            alignItems="flex-start"
            justifyContent="space-between"
            gap="spacingS"
            style={{ width: '100%' }}>
            <Heading marginBottom="spacingS">Select your file</Heading>
            <Grid columns="3fr 2fr" style={{ width: '100%' }}>
              <Grid.Item>
                <Paragraph>
                  Create entries using existing content types from a Google Drive file.
                  <br />
                  Get started by selecting the file you would like to use.
                </Paragraph>
              </Grid.Item>
              <Grid.Item justifySelf="end">
                <Button
                  variant="primary"
                  size="small"
                  isDisabled={!oauthToken}
                  onClick={onSelectFile}
                  endIcon={<ArrowRightIcon />}>
                  Select
                </Button>
              </Grid.Item>
            </Grid>
            <Note variant="neutral">
              This app only creates new entries. Any existing entries that need to be referenced
              must be assigned after the draft entries are created.
            </Note>
            {!isOAuthLoading && !isOAuthConnected && (
              <Note variant="warning" style={{ width: '100%' }}>
                Please connect to Google Drive before selecting your file.
              </Note>
            )}
          </Flex>
        </Card>
      </Flex>
    </Layout.Body>
  );
};
