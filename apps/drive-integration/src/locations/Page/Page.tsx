import { useEffect, useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Flex, Layout, Note, Spinner } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from './components/mainpage/ModalOrchestrator';
import { MainPageView } from './components/mainpage/MainPageView';
import { ReviewPage } from './components/review/ReviewPage';
import { RunsPage } from './components/runs/RunsPage';
import type { AppView, MappingReviewSuspendPayload } from '@types';
import { useGoogleDriveOAuth } from '@hooks/useGoogleDriveOAuth';
import { isAiAccessDeniedError } from '../../utils/aiAccess';
import { resumeAndPollWorkflow } from '../../services/workflowService';
import { useRunStorage } from '../../hooks/useRunStorage';
import { getWorkflowRun } from '../../services/agents-api';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const modalOrchestratorRef = useRef<ModalOrchestratorHandle>(null);

  const [aiAccessDeniedMessage, setAiAccessDeniedMessage] = useState<string | null>(null);
  const [appView, setAppView] = useState<AppView>({ view: 'runs' });
  const [pendingReviewPayload, setPendingReviewPayload] =
    useState<MappingReviewSuspendPayload | null>(null);
  const [isLoadingReviewPayload, setIsLoadingReviewPayload] = useState(false);

  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;

  const { runs, addRun, removeRun, markCompleted, storageError } = useRunStorage(spaceId, environmentId);

  const { oauthToken, isOAuthConnected, isOAuthLoading, isOAuthBusy, startOAuth, disconnectOAuth } =
    useGoogleDriveOAuth(sdk);

  // When navigating to the review view, fetch the suspend payload from the backend
  useEffect(() => {
    if (appView.view !== 'review') {
      setPendingReviewPayload(null);
      return;
    }

    let isCancelled = false;
    setIsLoadingReviewPayload(true);

    void getWorkflowRun(sdk, spaceId, environmentId, appView.runId)
      .then((runData) => {
        if (isCancelled) return;
        const payload = runData?.metadata?.suspendPayload ?? null;
        setPendingReviewPayload(payload);
      })
      .catch(() => {
        if (!isCancelled) setPendingReviewPayload(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingReviewPayload(false);
      });

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when the runId changes
  }, [appView.view === 'review' ? appView.runId : null]);

  const handleSelectFile = () => {
    modalOrchestratorRef.current?.startFlow();
  };

  const handleAiAccessDenied = (message: string) => {
    setAiAccessDeniedMessage(message);
  };

  const handleAiAccessRestored = () => {
    if (aiAccessDeniedMessage !== null) {
      setAiAccessDeniedMessage(null);
    }
  };

  const handleRunStarted = (_runId: string) => {
    setAppView({ view: 'runs' });
  };

  const handleReviewRun = (runId: string) => {
    setAppView({ view: 'review', runId });
  };

  const handleExitReview = () => {
    modalOrchestratorRef.current?.resetFlow();
    setAppView({ view: 'runs' });
  };

  const handleRunCompleted = (runId: string, entryIds: string[]) => {
    markCompleted(runId, entryIds);
  };

  const handleCancelReview = async (runId?: string) => {
    if (runId) {
      try {
        await resumeAndPollWorkflow(sdk, runId, { cancelled: true });
      } catch (error) {
        console.error(error);
      }
    }
    modalOrchestratorRef.current?.resetFlow();
    setAppView({ view: 'runs' });
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
            <Note variant="warning">{aiAccessDeniedMessage}</Note>
          </Flex>
        </Layout.Body>
      </Layout>
    );
  }

  const renderView = () => {
    switch (appView.view) {
      case 'runs':
        return (
          <RunsPage
            sdk={sdk}
            runs={runs}
            removeRun={removeRun}
            storageError={storageError}
            onNewImport={() => setAppView({ view: 'import' })}
            onReviewRun={handleReviewRun}
          />
        );

      case 'import':
        return (
          <MainPageView
            oauthToken={oauthToken}
            isOAuthConnected={isOAuthConnected}
            isOAuthLoading={isOAuthLoading}
            isOAuthBusy={isOAuthBusy}
            onConnectGoogleDrive={handleConnectGoogleDrive}
            onDisconnectGoogleDrive={handleDisconnectGoogleDrive}
            onSelectFile={handleSelectFile}
          />
        );

      case 'review': {
        if (isLoadingReviewPayload || !pendingReviewPayload) {
          return (
            <Flex
              justifyContent="center"
              alignItems="center"
              style={{ minHeight: '300px' }}>
              <Spinner size="large" />
            </Flex>
          );
        }

        return (
          <ReviewPage
            sdk={sdk}
            payload={pendingReviewPayload}
            runId={appView.runId}
            onCancelReview={() => handleCancelReview(appView.runId)}
            onExitReview={handleExitReview}
            onRunCompleted={(entryIds) => handleRunCompleted(appView.runId, entryIds)}
          />
        );
      }
    }
  };

  return (
    <>
      <Layout withBoxShadow={true} offsetTop={10}>
        {renderView()}
      </Layout>

      <ModalOrchestrator
        ref={modalOrchestratorRef}
        sdk={sdk}
        oauthToken={oauthToken}
        isOAuthConnected={isOAuthConnected}
        isOAuthBusy={isOAuthBusy}
        onReconnectGoogleDrive={startOAuth}
        onAiAccessDenied={handleAiAccessDenied}
        onRunStarted={handleRunStarted}
        onResetToMain={() => setAppView({ view: 'runs' })}
        addRun={addRun}
        storageError={storageError}
      />
    </>
  );
};

export default Page;
