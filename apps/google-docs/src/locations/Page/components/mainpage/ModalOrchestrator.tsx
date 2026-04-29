import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { Modal } from '@contentful/f36-components';
import { ContentTypeProps } from 'contentful-management';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { ErrorModal, type ErrorModalConfig } from '../modals/ErrorModal';
import SelectDocumentModal from '../modals/step_1/SelectDocumentModal';
import { LoadingModal } from '../modals/LoadingModal';
import { ERROR_MESSAGES } from '@constants/messages';
import { CONTENT_TYPE_SUBMIT_LOADING_DELAY_MS } from '@constants/agent';
import { SelectTabsModal } from '../modals/step_3/SelectTabsModal';
import {
  DocumentTabProps,
  MappingReviewSuspendPayload,
  CompletedWorkflowPayload,
  ResumePayload,
  TabsImagesSuspendPayload,
  RunStatus,
  WorkflowRunResult,
  WorkflowFailureReason,
  WorkflowRunError,
} from '@types';
import { ContentTypePickerModal } from '../modals/step_2/ContentTypePickerModal';
import { IncludeImagesModal } from '../modals/step_4/IncludeImagesModal';
import { useWorkflowAgent } from '@hooks/useWorkflowAgent';

export interface ModalOrchestratorHandle {
  startFlow: () => void;
  resetFlow: () => void;
}

enum FlowStep {
  CONTENT_TYPE_PICKER = 'contentTypePicker',
  SELECT_TABS = 'selectTabs',
  INCLUDE_IMAGES = 'includeImages',
  LOADING = 'loading',
}

interface ModalOrchestratorProps {
  sdk: PageAppSDK;
  oauthToken: string;
  isOAuthConnected?: boolean;
  isOAuthBusy?: boolean;
  onReconnectGoogleDrive?: () => Promise<void>;
  onMappingReviewReady: (payload: MappingReviewSuspendPayload, runId: string) => void;
  onResetToMain: () => void;
}

interface PreviewErrorState {
  reason: WorkflowFailureReason;
  title: string;
  message: string;
}

export const ModalOrchestrator = forwardRef<ModalOrchestratorHandle, ModalOrchestratorProps>(
  (
    {
      sdk,
      oauthToken,
      isOAuthConnected = false,
      isOAuthBusy = false,
      onReconnectGoogleDrive = async () => undefined,
      onMappingReviewReady,
      onResetToMain,
    },
    ref
  ) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
    const [previewErrorState, setPreviewErrorState] = useState<PreviewErrorState | null>(null);
    const [isReconnectPending, setIsReconnectPending] = useState(false);
    const [flowStep, setFlowStep] = useState<FlowStep | null>(null);
    const [documentId, setDocumentId] = useState<string>('');
    const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeProps[]>([]);
    const [availableTabs, setAvailableTabs] = useState<DocumentTabProps[]>([]);
    const [selectedTabs, setSelectedTabs] = useState<DocumentTabProps[]>([]);
    const [useAllTabs, setUseAllTabs] = useState<boolean | null>(null);
    const [includeImages, setIncludeImages] = useState<boolean | null>(null);
    const [requiresImageSelection, setRequiresImageSelection] = useState(false);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);
    const { startWorkflow, resumeWorkflow } = useWorkflowAgent({
      sdk,
      documentId,
      oauthToken,
    });

    const hasProgressToLose = documentId.trim().length > 0;

    useImperativeHandle(ref, () => ({
      startFlow: () => setIsUploadModalOpen(true),
      resetFlow: () => {
        setIsConfirmCancelModalOpen(false);
        setPreviewErrorState(null);
        setIsReconnectPending(false);
        resetProgress();
      },
    }));

    const resetDocumentScopeReview = () => {
      setAvailableTabs([]);
      setSelectedTabs([]);
      setUseAllTabs(null);
      setIncludeImages(null);
      setRequiresImageSelection(false);
    };

    const resetProgress = () => {
      setDocumentId('');
      setSelectedContentTypes([]);
      resetDocumentScopeReview();
      setActiveRunId(null);
      setFlowStep(null);
      setIsUploadModalOpen(false);
    };

    const showDiscardConfirmation = () => {
      if (!hasProgressToLose) return;
      setIsConfirmCancelModalOpen(true);
    };

    const handleFlowModalCloseRequest = () => {
      if (flowStep === FlowStep.LOADING) return;
      showDiscardConfirmation();
    };

    const closePreviewErrorAndReset = useCallback(() => {
      setPreviewErrorState(null);
      setIsReconnectPending(false);
      resetProgress();
      onResetToMain();
    }, [onResetToMain]);

    const handleConfirmCancel = async () => {
      setIsConfirmCancelModalOpen(false);

      if (activeRunId) {
        try {
          await resumeWorkflow(activeRunId, { cancelled: true });
        } catch (error) {
          console.error(error);
        }
      }

      resetProgress();
      onResetToMain();
    };

    const showWorkflowError = (error?: unknown) => {
      setFlowStep(null);

      if (
        error instanceof WorkflowRunError &&
        error.reason === WorkflowFailureReason.GOOGLE_DRIVE_AUTH_EXPIRED
      ) {
        setPreviewErrorState({
          reason: WorkflowFailureReason.GOOGLE_DRIVE_AUTH_EXPIRED,
          title: 'Reconnect Google Drive to continue',
          message: ERROR_MESSAGES.GOOGLE_DRIVE_AUTH_ERROR,
        });
        return;
      }

      setPreviewErrorState({
        reason: WorkflowFailureReason.GENERIC,
        title: 'Unable to generate preview',
        message: ERROR_MESSAGES.GENERIC_ERROR,
      });
    };

    useEffect(() => {
      if (!isReconnectPending || isOAuthBusy || !isOAuthConnected) {
        return;
      }

      closePreviewErrorAndReset();
    }, [closePreviewErrorAndReset, isOAuthBusy, isOAuthConnected, isReconnectPending]);

    const handleUploadModalCloseRequest = (docId?: string) => {
      if (docId) {
        setDocumentId(docId);
        setIsUploadModalOpen(false);
        setFlowStep(FlowStep.CONTENT_TYPE_PICKER);
        return;
      }

      setIsUploadModalOpen(false);
      showDiscardConfirmation();
    };

    const showDocumentScopeReview = (suspendPayload?: TabsImagesSuspendPayload) => {
      setAvailableTabs(
        (suspendPayload?.tabs ?? []).map((tab) => ({
          tabId: tab.id ?? '',
          tabTitle: tab.title ?? '',
        }))
      );
      setSelectedTabs([]);
      setUseAllTabs(null);
      setIncludeImages(null);
      setRequiresImageSelection(Boolean(suspendPayload?.requiresImageSelection));

      if (suspendPayload?.requiresTabSelection) {
        setFlowStep(FlowStep.SELECT_TABS);
        return;
      }

      if (suspendPayload?.requiresImageSelection) {
        setFlowStep(FlowStep.INCLUDE_IMAGES);
        return;
      }

      setFlowStep(null);
    };

    const handleWorkflowResult = (workflowRun: WorkflowRunResult) => {
      setActiveRunId(workflowRun.runId);

      if (workflowRun.status === RunStatus.PENDING_REVIEW) {
        if (workflowRun.suspendPayload.suspendStepId === 'mapping-review') {
          setFlowStep(null);
          onMappingReviewReady(workflowRun.suspendPayload, workflowRun.runId);
          return;
        }

        showDocumentScopeReview(workflowRun.suspendPayload);
        return;
      }

      setFlowStep(null);
    };

    const continueWorkflow = async (resumePayloadOverrides?: Partial<ResumePayload>) => {
      if (!activeRunId) {
        throw new Error('Workflow run id is missing for resume.');
      }

      const resumePayload: ResumePayload = {
        ...(selectedTabs.length > 0
          ? { selectedTabIds: selectedTabs.map((tab) => tab.tabId) }
          : {}),
        ...(includeImages !== null ? { includeImages } : {}),
        ...resumePayloadOverrides,
      };

      setFlowStep(FlowStep.LOADING);

      const workflowRun = await resumeWorkflow(activeRunId, resumePayload);
      handleWorkflowResult(workflowRun);
    };

    const startWorkflowWithDelayedLoading = async (contentTypeIds: string[]) => {
      let isStartPending = true;
      const loadingModalTimeout = window.setTimeout(() => {
        if (isStartPending) {
          setFlowStep(FlowStep.LOADING);
        }
      }, CONTENT_TYPE_SUBMIT_LOADING_DELAY_MS);

      try {
        return await startWorkflow(contentTypeIds);
      } finally {
        isStartPending = false;
        window.clearTimeout(loadingModalTimeout);
      }
    };

    const handleContentTypeContinue = async (contentTypeIds: string[]) => {
      try {
        handleWorkflowResult(await startWorkflowWithDelayedLoading(contentTypeIds));
      } catch (error) {
        showWorkflowError(error);
      }
    };

    const handleSelectTabsContinue = async (selectedTabs: DocumentTabProps[]) => {
      setSelectedTabs(selectedTabs);

      if (requiresImageSelection) {
        setFlowStep(FlowStep.INCLUDE_IMAGES);
        return;
      }

      try {
        await continueWorkflow({ selectedTabIds: selectedTabs.map((tab) => tab.tabId) });
      } catch (error) {
        showWorkflowError(error);
      }
    };

    const handleIncludeImagesContinue = async (includeImages: boolean) => {
      setIncludeImages(includeImages);

      try {
        await continueWorkflow({ includeImages });
      } catch (error) {
        showWorkflowError(error);
      }
    };

    const handleReconnectGoogleDrive = useCallback(async () => {
      setIsReconnectPending(true);

      try {
        await onReconnectGoogleDrive();
      } catch (error) {
        console.error(error);
        setIsReconnectPending(false);
      }
    }, [onReconnectGoogleDrive]);

    const errorModalConfig = useMemo<ErrorModalConfig>(() => {
      if (previewErrorState?.reason === WorkflowFailureReason.GOOGLE_DRIVE_AUTH_EXPIRED) {
        return {
          title: previewErrorState.title,
          message: previewErrorState.message,
          primaryActionLabel: 'Reconnect Google Drive',
          onPrimaryAction: () => void handleReconnectGoogleDrive(),
          secondaryActionLabel: 'Close',
          onSecondaryAction: closePreviewErrorAndReset,
          isPrimaryActionLoading: isReconnectPending && isOAuthBusy,
        };
      }

      return {
        title: previewErrorState?.title ?? 'Unable to generate preview',
        message: previewErrorState?.message ?? ERROR_MESSAGES.GENERIC_ERROR,
        primaryActionLabel: 'Close',
        onPrimaryAction: closePreviewErrorAndReset,
        isPrimaryActionLoading: false,
      };
    }, [
      closePreviewErrorAndReset,
      handleReconnectGoogleDrive,
      isOAuthBusy,
      isReconnectPending,
      previewErrorState,
    ]);

    const renderFlowStep = () => {
      switch (flowStep) {
        case FlowStep.CONTENT_TYPE_PICKER:
          return (
            <ContentTypePickerModal
              sdk={sdk}
              onClose={showDiscardConfirmation}
              onContinue={handleContentTypeContinue}
              selectedContentTypes={selectedContentTypes}
              setSelectedContentTypes={setSelectedContentTypes}
            />
          );
        case FlowStep.SELECT_TABS:
          return (
            <SelectTabsModal
              onContinue={handleSelectTabsContinue}
              onClose={showDiscardConfirmation}
              availableTabs={availableTabs}
              selectedTabs={selectedTabs}
              setSelectedTabs={setSelectedTabs}
              useAllTabs={useAllTabs}
              setUseAllTabs={setUseAllTabs}
            />
          );
        case FlowStep.INCLUDE_IMAGES:
          return (
            <IncludeImagesModal
              includeImages={includeImages}
              setIncludeImages={setIncludeImages}
              onContinue={handleIncludeImagesContinue}
              onClose={showDiscardConfirmation}
            />
          );
        case FlowStep.LOADING:
          return (
            <LoadingModal
              step="reviewingContentTypes"
              title="Preparing your preview"
              contentTypeCount={selectedContentTypes.length}
            />
          );
        default:
          return null;
      }
    };

    return (
      <>
        <SelectDocumentModal
          oauthToken={oauthToken}
          isOpen={isUploadModalOpen}
          onClose={handleUploadModalCloseRequest}
        />

        <Modal
          isShown={flowStep !== null}
          onClose={handleFlowModalCloseRequest}
          size={'large'}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEscapePress={flowStep !== FlowStep.LOADING}>
          {renderFlowStep}
        </Modal>

        <ConfirmCancelModal
          isOpen={isConfirmCancelModalOpen}
          onConfirm={handleConfirmCancel}
          onCancel={() => setIsConfirmCancelModalOpen(false)}
        />

        <ErrorModal
          isOpen={previewErrorState !== null}
          onClose={closePreviewErrorAndReset}
          config={errorModalConfig}
        />
      </>
    );
  }
);

ModalOrchestrator.displayName = 'ModalOrchestrator';
