import { useEffect, useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Button, Layout } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from './components/mainpage/ModalOrchestrator';
import { MainPageView } from './components/mainpage/MainPageView';
import { ReviewPage } from './components/review/ReviewPage';
import { loadFixtureReviewPayload } from '../../fixtures/googleDocsReview/loadFixtureReviewPayload';
import type { MappingReviewSuspendPayload } from '@types';
import { useWorkflowAgent } from '@hooks/useWorkflowAgent';
import { useGoogleDriveOAuth } from '@hooks/useGoogleDriveOAuth';

const enableMockReviewPayload = import.meta.env.VITE_ENABLE_MOCK_REVIEW_PAYLOAD === 'true';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const modalOrchestratorRef = useRef<ModalOrchestratorHandle>(null);
  const [mappingReviewState, setMappingReviewState] = useState<{
    payload: MappingReviewSuspendPayload;
    runId?: string;
  } | null>(null);
  const [fixtureReviewPayload, setFixtureReviewPayload] =
    useState<MappingReviewSuspendPayload | null>(null);
  const { oauthToken, isOAuthConnected, isOAuthLoading, isOAuthBusy, startOAuth, disconnectOAuth } =
    useGoogleDriveOAuth(sdk);
  const { resumeWorkflow } = useWorkflowAgent({
    sdk,
    documentId: '',
    oauthToken: '',
  });

  // TODO: remove fixture review payload loading before launch
  useEffect(() => {
    let isCancelled = false;

    void loadFixtureReviewPayload()
      .then((payload) => {
        if (!isCancelled) {
          setFixtureReviewPayload(payload);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setFixtureReviewPayload(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSelectFile = () => {
    modalOrchestratorRef.current?.startFlow();
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
            {/* TODO: remove mock review payload button before launch */}
            {enableMockReviewPayload && fixtureReviewPayload ? (
              <Button onClick={() => setMappingReviewState({ payload: fixtureReviewPayload })}>
                Mock from fixture
              </Button>
            ) : null}
            <MainPageView
              oauthToken={oauthToken}
              isOAuthConnected={isOAuthConnected}
              isOAuthLoading={isOAuthLoading}
              isOAuthBusy={isOAuthBusy}
              onConnectGoogleDrive={startOAuth}
              onDisconnectGoogleDrive={disconnectOAuth}
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
        onMappingReviewReady={handleMappingReviewReady}
        onResetToMain={handleReturnToMainPage}
      />
    </>
  );
};

export default Page;
