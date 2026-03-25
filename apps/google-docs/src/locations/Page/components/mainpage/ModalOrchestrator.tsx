import { forwardRef, useImperativeHandle, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { Modal } from '@contentful/f36-components';
import { ContentTypeProps } from 'contentful-management';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { ErrorModal } from '../modals/ErrorModal';
import SelectDocumentModal from '../modals/step_1/SelectDocumentModal';
import { LoadingModal } from '../modals/LoadingModal';
import { ERROR_MESSAGES } from '../../../../utils/constants/messages';
import { SelectTabsModal } from '../modals/step_3/SelectTabsModal';
import {
  DocumentTabProps,
  DocumentScopeResumePayload,
  DocumentScopeSuspendPayload,
  DocumentScopeReviewState,
  initialDocumentScopeReviewState,
} from '../../../../utils/types';
import { ContentTypePickerModal } from '../modals/step_2/ContentTypePickerModal';
import { IncludeImagesModal } from '../modals/step_4/IncludeImagesModal';
import { useWorkflowAgent } from '../../../../hooks/useWorkflowAgent';

export interface ModalOrchestratorHandle {
  startFlow: () => void;
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
}

export const ModalOrchestrator = forwardRef<ModalOrchestratorHandle, ModalOrchestratorProps>(
  ({ sdk, oauthToken }, ref) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
    const [isErrorPreviewModalOpen, setIsErrorPreviewModalOpen] = useState(false);
    const [flowStep, setFlowStep] = useState<FlowStep | null>(null);
    const [documentId, setDocumentId] = useState<string>('');
    const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeProps[]>([]);
    const [documentScopeReview, setDocumentScopeReview] = useState<DocumentScopeReviewState>(
      initialDocumentScopeReviewState
    );
    const [activeRunId, setActiveRunId] = useState<string | null>(null);
    const { startWorkflow, resumeWorkflow } = useWorkflowAgent({
      sdk,
      documentId,
      oauthToken,
    });

    const hasProgressToLose = documentId.trim().length > 0;

    useImperativeHandle(ref, () => ({
      startFlow: () => setIsUploadModalOpen(true),
    }));

    const updateDocumentScopeReview = (updates: Partial<DocumentScopeReviewState>) => {
      setDocumentScopeReview((currentState) => ({
        ...currentState,
        ...updates,
      }));
    };

    const resetProgress = () => {
      setDocumentId('');
      setSelectedContentTypes([]);
      setDocumentScopeReview(initialDocumentScopeReviewState);
      setActiveRunId(null);
      setFlowStep(null);
      setIsUploadModalOpen(false);
    };

    const showDiscardConfirmation = () => {
      if (!hasProgressToLose) return;
      setIsConfirmCancelModalOpen(true);
    };

    const closeModalAndReset = (setOpen: (open: boolean) => void) => () => {
      setOpen(false);
      resetProgress();
    };

    const showWorkflowError = (error: unknown, message: string) => {
      // eslint-disable-next-line no-console -- developer workflow logging
      console.error(message, error);
      setFlowStep(null);
      setIsErrorPreviewModalOpen(true);
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

    const showSelectTabsStep = () => {
      setFlowStep(FlowStep.SELECT_TABS);
    };

    const showIncludeImagesStep = () => {
      setFlowStep(FlowStep.INCLUDE_IMAGES);
    };

    const showDocumentScopeReview = (suspendPayload?: DocumentScopeSuspendPayload) => {
      setDocumentScopeReview({
        ...initialDocumentScopeReviewState,
        availableTabs: (suspendPayload?.tabs ?? []).map((tab) => ({
          tabId: tab.id ?? '',
          tabTitle: tab.title ?? '',
        })),
        requiresImageSelection: Boolean(suspendPayload?.requiresImageSelection),
      });

      if (suspendPayload?.requiresTabSelection) {
        showSelectTabsStep();
        return;
      }

      if (suspendPayload?.requiresImageSelection) {
        showIncludeImagesStep();
        return;
      }

      setFlowStep(null);
    };

    const handleWorkflowResult = (workflowRun: {
      runId: string;
      status: 'PENDING_REVIEW' | 'COMPLETED';
      suspendPayload?: DocumentScopeSuspendPayload;
    }) => {
      setActiveRunId(workflowRun.runId);

      if (workflowRun.status === 'PENDING_REVIEW') {
        showDocumentScopeReview(workflowRun.suspendPayload);
        return;
      }

      setFlowStep(null);
    };

    const continueWorkflow = async (
      resumePayloadOverrides?: Partial<DocumentScopeResumePayload>
    ) => {
      if (!activeRunId) {
        throw new Error('Workflow run id is missing for resume.');
      }

      const resumePayload: DocumentScopeResumePayload = {
        ...(documentScopeReview.selectedTabs.length > 0
          ? { selectedTabIds: documentScopeReview.selectedTabs.map((tab) => tab.tabId) }
          : {}),
        ...(documentScopeReview.includeImages !== null
          ? { includeImages: documentScopeReview.includeImages }
          : {}),
        ...resumePayloadOverrides,
      };

      setFlowStep(FlowStep.LOADING);

      const workflowRun = await resumeWorkflow(activeRunId, resumePayload);
      handleWorkflowResult(workflowRun);
    };

    const handleContentTypeContinue = async (contentTypeIds: string[]) => {
      setFlowStep(FlowStep.LOADING);

      try {
        handleWorkflowResult(await startWorkflow(contentTypeIds));
      } catch (error) {
        showWorkflowError(error, 'Failed to start Google Docs workflow:');
      }
    };

    const handleSelectTabsContinue = async (selectedTabs: DocumentTabProps[]) => {
      updateDocumentScopeReview({ selectedTabs });

      if (documentScopeReview.requiresImageSelection) {
        showIncludeImagesStep();
        return;
      }

      try {
        await continueWorkflow({ selectedTabIds: selectedTabs.map((tab) => tab.tabId) });
      } catch (error) {
        showWorkflowError(error, 'Failed to resume Google Docs workflow:');
      }
    };

    const handleIncludeImagesContinue = async (includeImages: boolean) => {
      updateDocumentScopeReview({ includeImages });

      try {
        await continueWorkflow({ includeImages });
      } catch (error) {
        showWorkflowError(error, 'Failed to resume Google Docs workflow:');
      }
    };

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
              availableTabs={documentScopeReview.availableTabs}
              setAvailableTabs={(availableTabs) => updateDocumentScopeReview({ availableTabs })}
              selectedTabs={documentScopeReview.selectedTabs}
              setSelectedTabs={(selectedTabs) => updateDocumentScopeReview({ selectedTabs })}
              useAllTabs={documentScopeReview.useAllTabs}
              setUseAllTabs={(useAllTabs) => updateDocumentScopeReview({ useAllTabs })}
            />
          );
        case FlowStep.INCLUDE_IMAGES:
          return (
            <IncludeImagesModal
              includeImages={documentScopeReview.includeImages}
              setIncludeImages={(includeImages) => updateDocumentScopeReview({ includeImages })}
              onContinue={handleIncludeImagesContinue}
              onClose={showDiscardConfirmation}
            />
          );
        case FlowStep.LOADING:
          return (
            <LoadingModal
              step="reviewingContentTypes"
              title="Preparing your preview"
              onClose={showDiscardConfirmation}
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
          onClose={showDiscardConfirmation}
          size={'large'}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEscapePress={flowStep !== FlowStep.LOADING}>
          {renderFlowStep}
        </Modal>

        <ConfirmCancelModal
          isOpen={isConfirmCancelModalOpen}
          onConfirm={closeModalAndReset(setIsConfirmCancelModalOpen)}
          onCancel={() => setIsConfirmCancelModalOpen(false)}
        />

        <ErrorModal
          isOpen={isErrorPreviewModalOpen}
          onClose={closeModalAndReset(setIsErrorPreviewModalOpen)}
          title="Unable to generate preview"
          message={ERROR_MESSAGES.GENERIC_ERROR}
          onTryAgain={() => setIsErrorPreviewModalOpen(false)}
        />
      </>
    );
  }
);

ModalOrchestrator.displayName = 'ModalOrchestrator';
