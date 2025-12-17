import { Button, Heading, Paragraph, Card, Layout, Flex, Note } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ArrowRightIcon } from '@contentful/f36-icons';
import { OAuthConnector } from './OAuthConnector';
import { useState } from 'react';

interface GettingStartedPageProps {
  onSelectFile: () => void;
  onOauthTokenChange: (token: string) => void;
  oauthToken: string;
}

export const GettingStartedPage = ({
  onSelectFile,
  oauthToken,
  onOauthTokenChange,
}: GettingStartedPageProps) => {
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const handleOAuthConnectedChange = (isOAuthConnectedValue: boolean) => {
    setIsOAuthConnected(isOAuthConnectedValue);
  };

  return (
    <Layout variant="fullscreen" withBoxShadow={true} offsetTop={10}>
      <Layout.Body>
        <Flex
          flexDirection="column"
          gap="spacingXl"
          style={{ maxWidth: '900px', margin: `${tokens.spacingL} auto` }}>
          <Heading marginBottom="none">Google Drive</Heading>
          <OAuthConnector
            onOAuthConnectedChange={handleOAuthConnectedChange}
            isOAuthConnected={isOAuthConnected}
            onOauthTokenChange={onOauthTokenChange}
          />
          <Card padding="large">
            {!isOAuthConnected && (
              <Note variant="warning" style={{ marginBottom: tokens.spacingM }}>
                Please connect to Google Drive before selecting your file.
              </Note>
            )}
            <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
              <Flex flexDirection="column" alignItems="flex-start">
                <Heading marginBottom="spacingS">Select your file</Heading>
                <Paragraph>
                  Create entries using existing content types from a Google Drive file.
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
    </Layout>
  );
};
