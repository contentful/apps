import { useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Layout } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from './components/mainpage/ModalOrchestrator';
import { MainPageView } from './components/mainpage/MainPageView';
import { ReviewPage } from './components/review/ReviewPage';
import type { MappingReviewSuspendPayload } from '@types';
import { useWorkflowAgent } from '@hooks/useWorkflowAgent';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const modalOrchestratorRef = useRef<ModalOrchestratorHandle>(null);
  const [oauthToken, setOauthToken] = useState<string>('');
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(true);
  const [mappingReviewState, setMappingReviewState] = useState<{
    payload: MappingReviewSuspendPayload;
    runId?: string;
  } | null>(null);
  const { resumeWorkflow } = useWorkflowAgent({
    sdk,
    documentId: '',
    oauthToken: '',
  });

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

  const handleMappingReviewReady = (payload: MappingReviewSuspendPayload, runId: string) => {
    setMappingReviewState({ payload, runId });
  };

  const handleReturnToMainPage = () => {
    setMappingReviewState(null);
  };

  const handleCancelMappingReview = async () => {
    if (!mappingReviewState?.runId) {
      handleReturnToMainPage();
      return;
    }

    try {
      await resumeWorkflow(mappingReviewState.runId, { cancelled: true });
    } catch (error) {
      console.error(error);
    } finally {
      handleReturnToMainPage();
    }
  };

  return (
    <>
      <Layout withBoxShadow={true} offsetTop={10}>
        {mappingReviewState ? (
          <ReviewPage
            sdk={sdk}
            payload={mappingReviewState.payload}
            runId={mappingReviewState.runId}
            onCancelReview={handleCancelMappingReview}
            onReturnToMainPage={handleReturnToMainPage}
          />
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
        onMappingReviewReady={handleMappingReviewReady}
        onResetToMain={handleReturnToMainPage}
      />
    </>
  );
};

export default Page;
