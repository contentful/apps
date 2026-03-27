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
import { MainPageView } from './components/mainpage/MainPageView';
import { PreviewPageView } from './components/mainpage/PreviewPageView';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const modalOrchestratorRef = useRef<ModalOrchestratorHandle>(null);
  const [oauthToken, setOauthToken] = useState<string>('');
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(true);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('Selected document');

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

  const handlePreviewReady = (title: string) => {
    setPreviewTitle(title);
    setIsPreviewVisible(true);
  };

  const handleReturnToMainPage = () => {
    // TODO: When we return to the main page we need to have the payload from the Backend to display the preview
    setIsPreviewVisible(false);
  };

  const handlePreviewCancel = () => {
    // TODO: When we cancel we want to tell the Backend to reset the flow and return to the main page
    setIsPreviewVisible(false);
  };

  return (
    <>
      <Layout withBoxShadow={true} offsetTop={10}>
        {isPreviewVisible ? (
          <PreviewPageView title={previewTitle} onCancel={handlePreviewCancel} />
        ) : (
          <MainPageView
            oauthToken={oauthToken}
            isOAuthConnected={isOAuthConnected}
            isOAuthLoading={isOAuthLoading}
            onOAuthConnectedChange={handleOAuthConnectedChange}
            onOauthTokenChange={handleOauthTokenChange}
            onLoadingStateChange={handleOAuthLoadingStateChange}
            onSelectFile={handleSelectFile}
          />
        )}
      </Layout>

      <ModalOrchestrator
        ref={modalOrchestratorRef}
        sdk={sdk}
        oauthToken={oauthToken}
        onPreviewReady={handlePreviewReady}
        onResetToMain={handleReturnToMainPage}
      />
    </>
  );
};

export default Page;
