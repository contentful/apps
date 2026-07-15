import { useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Flex, Heading, Layout, Note } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from './components/mainpage/ModalOrchestrator';
import { MainPageView } from './components/mainpage/MainPageView';
import { ReviewPage } from './components/review/ReviewPage';
import type { MappingReviewSuspendPayload } from '@types';
import { useWorkflowAgent } from '@hooks/useWorkflowAgent';
import { useGoogleDriveOAuth } from '@hooks/useGoogleDriveOAuth';
import { isAiAccessDeniedError } from '../../utils/aiAccess';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const modalOrchestratorRef = useRef<ModalOrchestratorHandle>(null);
  const [aiAccessDeniedMessage, setAiAccessDeniedMessage] = useState<string | null>(null);
  const [mappingReviewState, setMappingReviewState] = useState<{
    payload: MappingReviewSuspendPayload;
    runId?: string;
  } | null>(null);
  const { oauthToken, isOAuthConnected, isOAuthLoading, isOAuthBusy, startOAuth, disconnectOAuth } =
    useGoogleDriveOAuth(sdk);
  const { resumeWorkflow } = useWorkflowAgent({
    sdk,
    documentId: '',
    oauthToken: '',
  });

  const handleSelectFile = () => {
    modalOrchestratorRef.current?.startFlow();
  };

  const handleAiAccessDenied = (message: string) => {
    setAiAccessDeniedMessage(message);
    setMappingReviewState(null);
  };

  const handleAiAccessRestored = () => {
    if (aiAccessDeniedMessage !== null) {
      setAiAccessDeniedMessage(null);
    }
  };

  const handleMappingReviewReady = (payload: MappingReviewSuspendPayload, runId: string) => {
    setMappingReviewState({ payload, runId });
  };

  const handleReturnToMainPage = () => {
    setMappingReviewState(null);
  };

  const resetFlowAndReturnToMainPage = () => {
    modalOrchestratorRef.current?.resetFlow();
    handleReturnToMainPage();
  };

  const handleCancelMappingReview = async () => {
    if (!mappingReviewState?.runId) {
      resetFlowAndReturnToMainPage();
      return;
    }

    try {
      await resumeWorkflow(mappingReviewState.runId, { cancelled: true });
    } catch (error) {
      console.error(error);
    } finally {
      resetFlowAndReturnToMainPage();
    }
  };

  const handleConnectGoogleDrive = async () => {
    handleAiAccessRestored();
    try {
      await startOAuth();
    } catch (error) {
      if (isAiAccessDeniedError(error)) {
        handleAiAccessDenied(error.message);
      }
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    try {
      await disconnectOAuth();
    } catch (error) {
      if (isAiAccessDeniedError(error)) {
        handleAiAccessDenied(error.message);
      }
    }
  };

  if (aiAccessDeniedMessage !== null) {
    return (
      <Layout withBoxShadow={true} offsetTop={10}>
        <Layout.Body>
          <Flex
            flexDirection="column"
            gap="spacingM"
            style={{ maxWidth: '900px', margin: '24px auto' }}>
            <Heading marginBottom="none">Drive Integration</Heading>
            <Note variant="warning">{aiAccessDeniedMessage}</Note>
          </Flex>
        </Layout.Body>
      </Layout>
    );
  }

  return (
    <>
      <Layout withBoxShadow={true} offsetTop={10}>
        {mappingReviewState ? (
          <ReviewPage
            sdk={sdk}
            payload={mappingReviewState.payload}
            runId={mappingReviewState.runId}
            onCancelReview={handleCancelMappingReview}
            onExitReview={resetFlowAndReturnToMainPage}
          />
        ) : (
          <>
            <MainPageView
              oauthToken={oauthToken}
              isOAuthConnected={isOAuthConnected}
              isOAuthLoading={isOAuthLoading}
              isOAuthBusy={isOAuthBusy}
              onConnectGoogleDrive={handleConnectGoogleDrive}
              onDisconnectGoogleDrive={handleDisconnectGoogleDrive}
              onSelectFile={handleSelectFile}
            />
          </>
        )}
      </Layout>

      <ModalOrchestrator
        ref={modalOrchestratorRef}
        sdk={sdk}
        oauthToken={oauthToken}
        isOAuthConnected={isOAuthConnected}
        isOAuthBusy={isOAuthBusy}
        onReconnectGoogleDrive={startOAuth}
        onAiAccessDenied={handleAiAccessDenied}
        onMappingReviewReady={handleMappingReviewReady}
        onResetToMain={handleReturnToMainPage}
      />
    </>
  );
};

export default Page;
