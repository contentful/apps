import { useEffect, useState } from 'react';
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
  RunStatus,
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
  onPreviewReady: (previewTitle: string) => void;
  onResetToMain: () => void;
}

export const ModalOrchestrator = ({
  sdk,
  oauthToken,
  onPreviewReady,
  onResetToMain,
}: ModalOrchestratorProps) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const [isErrorPreviewModalOpen, setIsErrorPreviewModalOpen] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeProps[]>([]);
  const [availableTabs, setAvailableTabs] = useState<DocumentTabProps[]>([]);
  const [selectedTabs, setSelectedTabs] = useState<DocumentTabProps[]>([]);
  const [useAllTabs, setUseAllTabs] = useState<boolean | null>(null);
  const [includeImages, setIncludeImages] = useState<boolean | null>(null);
  const [requiresImageSelection, setRequiresImageSelection] = useState<boolean>(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const { startWorkflow, resumeWorkflow } = useWorkflowAgent({
    sdk,
    documentId,
    oauthToken,
  });

  const hasProgressToLose = documentId.trim().length > 0;
  const isStepperShown = flowStep !== null;

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

  const closeModalAndReset = (setOpen: (open: boolean) => void) => () => {
    setOpen(false);
    resetProgress();
    onResetToMain();
  };

  const showWorkflowError = () => {
    setFlowStep(null);
    setIsErrorPreviewModalOpen(true);
  };

  const handleUploadModalCloseRequest = (docId?: string) => {
    if (docId) {
      setDocumentId(docId);
      setFlowStep(FlowStep.CONTENT_TYPE_PICKER);
      return;
    }

    setIsUploadModalOpen(false);
    showDiscardConfirmation();
  };

  const showDocumentScopeReview = (suspendPayload?: DocumentScopeSuspendPayload) => {
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

  const handleWorkflowResult = (workflowRun: {
    runId: string;
    status: RunStatus.PENDING_REVIEW | RunStatus.COMPLETED;
    suspendPayload?: DocumentScopeSuspendPayload;
  }) => {
    setActiveRunId(workflowRun.runId);

    if (workflowRun.status === RunStatus.PENDING_REVIEW) {
      showDocumentScopeReview(workflowRun.suspendPayload);
      return;
    }

    setFlowStep(null);
  };

  const continueWorkflow = async (resumePayloadOverrides?: Partial<DocumentScopeResumePayload>) => {
    if (!activeRunId) {
      throw new Error('Workflow run id is missing for resume.');
    }

    const resumePayload: DocumentScopeResumePayload = {
      ...(selectedTabs.length > 0 ? { selectedTabIds: selectedTabs.map((tab) => tab.tabId) } : {}),
      ...(includeImages !== null ? { includeImages } : {}),
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
      showWorkflowError();
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
      showWorkflowError();
    }
  };

  const handleIncludeImagesContinue = async (includeImages: boolean) => {
    setIncludeImages(includeImages);

    try {
      await continueWorkflow({ includeImages });
    } catch (error) {
      showWorkflowError();
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
            availableTabs={availableTabs}
            setAvailableTabs={setAvailableTabs}
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
            onClose={showDiscardConfirmation}
            contentTypeCount={selectedContentTypes.length}
            onCompleted={onPreviewReady}
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
        isShown={isStepperShown}
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
};
