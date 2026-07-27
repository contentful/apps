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
  RunStatus,
  WorkflowRunResult,
  WorkflowFailureReason,
  WorkflowRunError,
} from '@types';
import { ContentTypePickerModal } from '../modals/step_2/ContentTypePickerModal';
import { IncludeImagesModal } from '../modals/step_4/IncludeImagesModal';
import { useWorkflowAgentLegacy } from '@hooks/useWorkflowAgentLegacy';
import { isAiAccessDeniedError } from '../../../../utils/aiAccess';
import {
  fetchDocumentSelection,
  DocumentSelectionConfig,
} from '../../../../utils/fetchDocumentSelection';

export interface ModalOrchestratorLegacyHandle {
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
  onAiAccessDenied?: (message: string) => void;
  onMappingReviewReady: (payload: MappingReviewSuspendPayload, runId: string) => void;
  onResetToMain: () => void;
}

interface PreviewErrorState {
  reason: WorkflowFailureReason;
  title: string;
  message: string;
}

export const ModalOrchestratorLegacy = forwardRef<
  ModalOrchestratorLegacyHandle,
  ModalOrchestratorProps
>(
  (
    {
      sdk,
      oauthToken,
      isOAuthConnected = false,
      isOAuthBusy = false,
      onReconnectGoogleDrive = async () => undefined,
      onMappingReviewReady,
      onResetToMain,
      onAiAccessDenied,
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
    const { startWorkflow, resumeWorkflow } = useWorkflowAgentLegacy({
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
          title: 'Reconnect Drive to continue',
          message: ERROR_MESSAGES.GOOGLE_DRIVE_AUTH_ERROR,
        });
        return;
      }

      if (
        error instanceof WorkflowRunError &&
        error.reason === WorkflowFailureReason.GOOGLE_DOCS_NOT_FOUND
      ) {
        setPreviewErrorState({
          reason: WorkflowFailureReason.GOOGLE_DOCS_NOT_FOUND,
          title: 'Document not found',
          message: ERROR_MESSAGES.GOOGLE_DOCS_NOT_FOUND,
        });
        return;
      }

      if (
        error instanceof WorkflowRunError &&
        error.reason === WorkflowFailureReason.AI_SERVICE_UNAVAILABLE
      ) {
        setPreviewErrorState({
          reason: WorkflowFailureReason.AI_SERVICE_UNAVAILABLE,
          title: 'AI service temporarily unavailable',
          message: ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE,
        });
        return;
      }

      if (
        error instanceof WorkflowRunError &&
        error.reason === WorkflowFailureReason.APP_NOT_INSTALLED
      ) {
        setPreviewErrorState({
          reason: WorkflowFailureReason.APP_NOT_INSTALLED,
          title: 'App not installed in this environment',
          message: ERROR_MESSAGES.APP_NOT_INSTALLED,
        });
        return;
      }

      if (
        error instanceof WorkflowRunError &&
        error.reason === WorkflowFailureReason.DOCUMENT_TOO_COMPLEX
      ) {
        setPreviewErrorState({
          reason: WorkflowFailureReason.DOCUMENT_TOO_COMPLEX,
          title: 'Document too large to import',
          message: ERROR_MESSAGES.DOCUMENT_TOO_COMPLEX,
        });
        return;
      }

      if (
        error instanceof WorkflowRunError &&
        error.reason === WorkflowFailureReason.PROCESSING_TIMEOUT
      ) {
        setPreviewErrorState({
          reason: WorkflowFailureReason.PROCESSING_TIMEOUT,
          title: 'Import timed out',
          message: ERROR_MESSAGES.PROCESSING_TIMEOUT,
        });
        return;
      }

      if (
        error instanceof WorkflowRunError &&
        error.reason === WorkflowFailureReason.OUT_OF_DOMAIN
      ) {
        setPreviewErrorState({
          reason: WorkflowFailureReason.OUT_OF_DOMAIN,
          title: 'Document not supported',
          message: ERROR_MESSAGES.OUT_OF_DOMAIN,
        });
        return;
      }

      if (
        error instanceof WorkflowRunError &&
        error.reason === WorkflowFailureReason.MISSING_PARAMETER
      ) {
        setPreviewErrorState({
          reason: WorkflowFailureReason.MISSING_PARAMETER,
          title: 'Missing parameter',
          message: ERROR_MESSAGES.MISSING_PARAMETER,
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

    const handleWorkflowError = (error: unknown) => {
      if (isAiAccessDeniedError(error)) {
        resetProgress();
        onResetToMain();
        onAiAccessDenied?.(error.message);
        return;
      }

      showWorkflowError(error);
    };

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

    const showDocumentScopeReview = (
      selectionConfig: DocumentSelectionConfig,
      contentTypeIds: string[]
    ) => {
      setAvailableTabs(selectionConfig.tabs.map((tab) => ({ tabId: tab.id, tabTitle: tab.title })));
      setSelectedTabs([]);
      setUseAllTabs(null);
      setIncludeImages(null);
      const requiresTabSelection = selectionConfig.tabs.length > 1;
      const requiresImages = selectionConfig.imageCount > 0;
      setRequiresImageSelection(requiresImages);

      if (requiresTabSelection) {
        setFlowStep(FlowStep.SELECT_TABS);
        return;
      }

      if (requiresImages) {
        setFlowStep(FlowStep.INCLUDE_IMAGES);
        return;
      }

      void startWorkflowWithDelayedLoading(contentTypeIds, {
        selectedTabIds: [],
        includeImages: false,
      }).catch(handleWorkflowError);
    };

    const handleWorkflowResult = (workflowRun: WorkflowRunResult) => {
      setActiveRunId(workflowRun.runId);

      if (workflowRun.status === RunStatus.PENDING_REVIEW) {
        setFlowStep(null);
        onMappingReviewReady(workflowRun.suspendPayload, workflowRun.runId);
        return;
      }

      setFlowStep(null);
    };

    const startWorkflowWithDelayedLoading = async (
      contentTypeIds: string[],
      documentSelection: { selectedTabIds: string[]; includeImages: boolean }
    ) => {
      let isStartPending = true;
      const loadingModalTimeout = window.setTimeout(() => {
        if (isStartPending) {
          setFlowStep(FlowStep.LOADING);
        }
      }, CONTENT_TYPE_SUBMIT_LOADING_DELAY_MS);

      try {
        return await startWorkflow(contentTypeIds, documentSelection);
      } finally {
        isStartPending = false;
        window.clearTimeout(loadingModalTimeout);
      }
    };

    const handleContentTypeContinue = async (contentTypeIds: string[]) => {
      if (!isOAuthConnected) {
        showWorkflowError(
          new WorkflowRunError(
            ERROR_MESSAGES.GOOGLE_DRIVE_AUTH_ERROR,
            WorkflowFailureReason.GOOGLE_DRIVE_AUTH_EXPIRED
          )
        );
        return;
      }

      let selectionConfig: DocumentSelectionConfig;
      try {
        selectionConfig = await fetchDocumentSelection(documentId, oauthToken);
      } catch (error) {
        handleWorkflowError(error);
        return;
      }

      showDocumentScopeReview(selectionConfig, contentTypeIds);
    };

    const handleSelectTabsContinue = async (selectedTabs: DocumentTabProps[]) => {
      setSelectedTabs(selectedTabs);

      if (requiresImageSelection) {
        setFlowStep(FlowStep.INCLUDE_IMAGES);
        return;
      }

      try {
        handleWorkflowResult(
          await startWorkflowWithDelayedLoading(
            selectedContentTypes.map((ct) => ct.sys.id),
            { selectedTabIds: selectedTabs.map((tab) => tab.tabId), includeImages: false }
          )
        );
      } catch (error) {
        handleWorkflowError(error);
      }
    };

    const handleIncludeImagesContinue = async (includeImages: boolean) => {
      setIncludeImages(includeImages);

      try {
        handleWorkflowResult(
          await startWorkflowWithDelayedLoading(
            selectedContentTypes.map((ct) => ct.sys.id),
            {
              selectedTabIds: selectedTabs.map((tab) => tab.tabId),
              includeImages,
            }
          )
        );
      } catch (error) {
        handleWorkflowError(error);
      }
    };

    const handleReconnectGoogleDrive = useCallback(async () => {
      setIsReconnectPending(true);

      try {
        await onReconnectGoogleDrive();
      } catch (error) {
        handleWorkflowError(error);
        setIsReconnectPending(false);
      }
    }, [handleWorkflowError, onReconnectGoogleDrive]);

    const errorModalConfig = useMemo<ErrorModalConfig>(() => {
      if (previewErrorState?.reason === WorkflowFailureReason.GOOGLE_DRIVE_AUTH_EXPIRED) {
        return {
          title: previewErrorState.title,
          message: previewErrorState.message,
          primaryActionLabel: 'Reconnect Drive',
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

ModalOrchestratorLegacy.displayName = 'ModalOrchestratorLegacy';
