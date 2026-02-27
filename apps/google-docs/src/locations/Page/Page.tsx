import { useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Button,
  Heading,
  Paragraph,
  Card,
  Layout,
  Flex,
  Note,
  Box,
  Text,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ArrowRightIcon } from '@contentful/f36-icons';
import { OAuthConnector } from './components/mainpage/OAuthConnector';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from './components/mainpage/ModalOrchestrator';
import { css } from '@emotion/css';

const styles = {
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

            <Note variant="primary" title="Optimization tip" className={styles.note}>
              <Flex flexDirection="column" alignItems="flex-start" gap="spacingS" fullWidth>
                <Paragraph>
                  Use context markers in your document to exclude content that shouldn't be added to
                  an entry. The AI looks for these markers during extraction and ignores any content
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
        </Layout.Body>
      </Layout>

      <ModalOrchestrator ref={modalOrchestratorRef} sdk={sdk} oauthToken={oauthToken} />
    </>
  );
};

export default Page;
