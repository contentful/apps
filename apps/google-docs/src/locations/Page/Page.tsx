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
import { MappingReviewSuspendPayload, PreviewPayload, ResumePayload } from '@types';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const modalOrchestratorRef = useRef<ModalOrchestratorHandle>(null);
  const [oauthToken, setOauthToken] = useState<string>('');
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(true);
  const [isMappingPrototypeVisible, setIsMappingPrototypeVisible] = useState(false);
  const [mappingReviewPayload, setMappingReviewPayload] =
    useState<MappingReviewSuspendPayload | null>(null);
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
    setIsMappingPrototypeVisible(false);
    setMappingReviewPayload(null);
    setPreviewPayload(payload);
  };

  const handleMappingReviewReady = (payload: MappingReviewSuspendPayload) => {
    setIsMappingPrototypeVisible(false);
    setPreviewPayload(null);
    setMappingReviewPayload(payload);
  };

  const handleReturnToMainPage = () => {
    setIsMappingPrototypeVisible(false);
    setMappingReviewPayload(null);
    setPreviewPayload(null);
  };

  const handlePreviewCancel = () => {
    if (isMappingPrototypeVisible) {
      handleReturnToMainPage();
      return;
    }

    modalOrchestratorRef.current?.resetFlowFromPreviewCancel();
  };

  const handleMappingReviewContinue = async (resumePayload: ResumePayload) => {
    await modalOrchestratorRef.current?.resumeMappingReview(resumePayload);
  };

  return (
    <>
      <Layout withBoxShadow={true} offsetTop={10}>
        {previewPayload || mappingReviewPayload || isMappingPrototypeVisible ? (
          isMappingPrototypeVisible ? (
            <PreviewPageView mode="fixture" onCancel={handlePreviewCancel} sdk={sdk} />
          ) : mappingReviewPayload ? (
            <PreviewPageView
              mode="mappingReview"
              payload={mappingReviewPayload}
              onCancel={handlePreviewCancel}
              onContinue={handleMappingReviewContinue}
              sdk={sdk}
            />
          ) : (
            <PreviewPageView
              mode="workflow"
              payload={previewPayload!}
              onCancel={handlePreviewCancel}
              sdk={sdk}
            />
          )
        ) : (
          <MainPageView
            oauthToken={oauthToken}
            isOAuthConnected={isOAuthConnected}
            isOAuthLoading={isOAuthLoading}
            onOAuthConnectedChange={handleOAuthConnectedChange}
            onOauthTokenChange={handleOauthTokenChange}
            onLoadingStateChange={handleOAuthLoadingStateChange}
            onSelectFile={handleSelectFile}
            onUseFixturePreview={() => setIsMappingPrototypeVisible(true)}
            sdk={sdk}
          />
        )}
      </Layout>

      <ModalOrchestrator
        ref={modalOrchestratorRef}
        sdk={sdk}
        oauthToken={oauthToken}
        onPreviewReady={handlePreviewReady}
        onMappingReviewReady={handleMappingReviewReady}
        onResetToMain={handleReturnToMainPage}
      />
    </>
  );
};

export default Page;
