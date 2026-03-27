import { ArrowRightIcon } from '@contentful/f36-icons';
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Layout,
  Note,
  Paragraph,
  Text,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { OAuthConnector } from './OAuthConnector';

interface MainPageViewProps {
  oauthToken: string;
  isOAuthConnected: boolean;
  isOAuthLoading: boolean;
  onOAuthConnectedChange: (isConnected: boolean) => void;
  onOauthTokenChange: (token: string) => void;
  onLoadingStateChange: (isLoading: boolean) => void;
  onSelectFile: () => void;
}

export const MainPageView = ({
  oauthToken,
  isOAuthConnected,
  isOAuthLoading,
  onOAuthConnectedChange,
  onOauthTokenChange,
  onLoadingStateChange,
  onSelectFile,
}: MainPageViewProps) => {
  return (
    <Layout.Body>
      <Flex
        flexDirection="column"
        gap="spacingXl"
        style={{ maxWidth: '900px', margin: `${tokens.spacingL} auto` }}>
        <Heading marginBottom="none">Drive Integration</Heading>
        <OAuthConnector
          oauthToken={oauthToken}
          onOAuthConnectedChange={onOAuthConnectedChange}
          isOAuthConnected={isOAuthConnected}
          onOauthTokenChange={onOauthTokenChange}
          onLoadingStateChange={onLoadingStateChange}
        />
        <Card padding="large">
          {!isOAuthLoading && !isOAuthConnected && (
            <Note variant="warning" style={{ marginBottom: tokens.spacingM }}>
              Please connect to Drive Integration before selecting your file.
            </Note>
          )}
          <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
            <Flex flexDirection="column" alignItems="flex-start">
              <Heading marginBottom="spacingS">Select your file</Heading>
              <Paragraph>
                Create entries using existing content types from a Drive Integration file.
                <br />
                Get started by selecting the file you would like to use.
              </Paragraph>
            </Flex>

            <Button
              variant="primary"
              isDisabled={!oauthToken}
              onClick={onSelectFile}
              endIcon={<ArrowRightIcon />}>
              Select your file
            </Button>
          </Flex>
        </Card>
      </Flex>
    </Layout.Body>
  );
};
