import { useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Button, Heading, Paragraph, Card, Layout, Flex, Note } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ArrowRightIcon } from '@contentful/f36-icons';
import { OAuthConnector } from './components/mainpage/OAuthConnector';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from './components/mainpage/ModalOrchestrator';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const modalOrchestratorRef = useRef<ModalOrchestratorHandle>(null);
  const [oauthToken, setOauthToken] = useState<string>('');
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(true);

  const handleOauthTokenChange = (token: string) => {
    setOauthToken(token);
  };

  const handleOAuthConnectedChange = (isConnected: boolean) => {
    setIsOAuthConnected(isConnected);
  };

  const handleOAuthLoadingStateChange = (isLoading: boolean) => {
    setIsOAuthLoading(isLoading);
  };

  const handleSelectFile = () => {
    modalOrchestratorRef.current?.startFlow();
  };

  return (
    <>
      <Layout variant="fullscreen" withBoxShadow={true} offsetTop={10}>
        <Layout.Body>
          <Flex
            flexDirection="column"
            gap="spacingXl"
            style={{ maxWidth: '900px', margin: `${tokens.spacingL} auto` }}>
            <Heading marginBottom="none">Google Drive</Heading>
            <OAuthConnector
              oauthToken={oauthToken}
              onOAuthConnectedChange={handleOAuthConnectedChange}
              isOAuthConnected={isOAuthConnected}
              onOauthTokenChange={handleOauthTokenChange}
              onLoadingStateChange={handleOAuthLoadingStateChange}
            />
            <Card padding="large">
              {!isOAuthLoading && !isOAuthConnected && (
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
                  onClick={handleSelectFile}
                  endIcon={<ArrowRightIcon />}>
                  Select your file
                </Button>
              </Flex>
            </Card>
          </Flex>
        </Layout.Body>
      </Layout>

      <ModalOrchestrator ref={modalOrchestratorRef} sdk={sdk} oauthToken={oauthToken} />
    </>
  );
};

export default Page;
