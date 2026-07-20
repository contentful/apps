import { useEffect, useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Flex, Layout, Note, Spinner } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from './components/mainpage/ModalOrchestrator';
import { ReviewPage } from './components/review/ReviewPage';
import { RunsPage } from './components/runs/RunsPage';
import type { AppView, MappingReviewSuspendPayload } from '@types';
import { AppViewKind } from '../../types/runs';
import type { EntryBlockGraph } from '../../types/entryBlockGraph';
import { useGoogleDriveOAuth } from '@hooks/useGoogleDriveOAuth';
import { isAiAccessDeniedError } from '../../utils/aiAccess';
import { resumeAndPollWorkflow } from '../../services/workflowService';
import { useRunStorage } from '../../hooks/useRunStorage';
import { getWorkflowRun, startAgentRun } from '../../services/agents-api';
import { WORKFLOW_AGENT_ID } from '../../utils/constants/agent';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const modalOrchestratorRef = useRef<ModalOrchestratorHandle>(null);

  const [aiAccessDeniedMessage, setAiAccessDeniedMessage] = useState<string | null>(null);
  const [appView, setAppView] = useState<AppView>({ view: AppViewKind.RUNS });
  const [pendingReviewPayload, setPendingReviewPayload] =
    useState<MappingReviewSuspendPayload | null>(null);
  const [isLoadingReviewPayload, setIsLoadingReviewPayload] = useState(false);

  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;

  const { runs, addRun, removeRun, retryRun, markCompleted, storageError } = useRunStorage(
    spaceId,
    environmentId
  );

  const { oauthToken, isOAuthConnected, isOAuthBusy, startOAuth, disconnectOAuth } =
    useGoogleDriveOAuth(sdk);

  // When navigating to the review view, fetch the suspend payload from the backend
  useEffect(() => {
    if (appView.view !== AppViewKind.REVIEW) {
      setPendingReviewPayload(null);
      setIsLoadingReviewPayload(false);
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
  }, [appView.view === AppViewKind.REVIEW ? appView.runId : null]);

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

  const handleRunStarted = () => {
    setAppView({ view: AppViewKind.RUNS });
  };

  const handleReviewRun = (runId: string) => {
    setAppView({ view: AppViewKind.REVIEW, runId });
  };

  const handleExitReview = () => {
    modalOrchestratorRef.current?.resetFlow();
    handleRunStarted();
  };

  const handleRunCompleted = (runId: string, entryIds: string[]) => {
    markCompleted(runId, entryIds);
  };

  const handleCancelReview = async (runId: string, entryBlockGraph: EntryBlockGraph) => {
    try {
      await resumeAndPollWorkflow(sdk, runId, { cancelled: true, entryBlockGraph });
    } catch (error) {
      console.error(error);
    }
    modalOrchestratorRef.current?.resetFlow();
    handleRunStarted();
  };

  const handleRetryRun = async (runId: string) => {
    const record = runs.find((r) => r.runId === runId);
    if (!record) return;

    const threadId = [crypto.randomUUID(), WORKFLOW_AGENT_ID].join('-');
    const newRunId = await startAgentRun(sdk, spaceId, environmentId, {
      messages: [
        {
          role: 'user',
          parts: [
            {
              type: 'text',
              text: `Analyze the following google docs document ${record.documentId} and extract the Contentful entries and assets for the following content types: ${record.contentTypeIds.join(', ')}`,
            },
          ],
        },
      ],
      metadata: {
        documentId: record.documentId,
        contentTypeIds: record.contentTypeIds,
        oauthToken,
        documentSelection: record.documentSelection,
      },
      threadId,
    });

    retryRun(runId, {
      ...record,
      runId: newRunId,
      startedAt: new Date().toISOString(),
      createdEntryIds: undefined,
    });
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
      case AppViewKind.RUNS:
        return (
          <RunsPage
            sdk={sdk}
            runs={runs}
            removeRun={removeRun}
            storageError={storageError}
            onStartImport={handleSelectFile}
            onReviewRun={handleReviewRun}
            onRetryRun={handleRetryRun}
            isOAuthConnected={isOAuthConnected}
            isOAuthBusy={isOAuthBusy}
            onConnectGoogleDrive={handleConnectGoogleDrive}
            onDisconnectGoogleDrive={handleDisconnectGoogleDrive}
          />
        );

      case AppViewKind.REVIEW: {
        if (isLoadingReviewPayload || !pendingReviewPayload) {
          return (
            <Flex justifyContent="center" alignItems="center" style={{ minHeight: '300px' }}>
              <Spinner size="large" />
            </Flex>
          );
        }

        return (
          <ReviewPage
            sdk={sdk}
            payload={pendingReviewPayload}
            runId={appView.runId}
            onCancelReview={(graph) => handleCancelReview(appView.runId, graph)}
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
        onResetToMain={handleRunStarted}
        addRun={addRun}
        storageError={storageError}
      />
    </>
  );
};

export default Page;
