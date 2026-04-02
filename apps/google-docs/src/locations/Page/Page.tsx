import { useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Layout } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from './components/mainpage/ModalOrchestrator';
import { MainPageView } from './components/mainpage/MainPageView';
import { PreviewPageView } from './components/mainpage/PreviewPageView';
import { PreviewPayload } from '@types';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const modalOrchestratorRef = useRef<ModalOrchestratorHandle>(null);
  const [oauthToken, setOauthToken] = useState<string>('');
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(true);
  const [previewPayload, setPreviewPayload] = useState<PreviewPayload | null>(null);

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

  const handlePreviewReady = (payload: PreviewPayload) => {
    setPreviewPayload(payload);
  };

  const handleReturnToMainPage = () => {
    setPreviewPayload(null);
  };

  const handlePreviewCancel = () => {
    modalOrchestratorRef.current?.resetFlowFromPreviewCancel();
  };

  return (
    <>
      <Layout withBoxShadow={true} offsetTop={10}>
        {previewPayload ? (
          <PreviewPageView payload={previewPayload} onCancel={handlePreviewCancel} />
        ) : (
          <MainPageView
            oauthToken={oauthToken}
            isOAuthConnected={isOAuthConnected}
            isOAuthLoading={isOAuthLoading}
            onOAuthConnectedChange={handleOAuthConnectedChange}
            onOauthTokenChange={handleOauthTokenChange}
            onLoadingStateChange={handleOAuthLoadingStateChange}
            onSelectFile={handleSelectFile}
            sdk={sdk}
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
