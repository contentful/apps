import { forwardRef, useImperativeHandle, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { Modal } from '@contentful/f36-components';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { useProgressTracking } from '../../../../hooks/useProgressTracking';
import { ErrorModal } from '../modals/ErrorModal';
import SelectDocumentModal from '../modals/step_1/SelectDocumentModal';
import { LoadingModal } from '../modals/LoadingModal';
import { ERROR_MESSAGES } from '../../../../utils/constants/messages';
import { SelectTabsModal } from '../modals/step_3/SelectTabsModal';
import { DocumentTabProps } from '../../../../utils/types';
import { ContentTypePickerModal } from '../modals/step_2/ContentTypePickerModal';

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
    const MOCK_HAS_PENDING_IMAGES_REVIEW = true;
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
    const [isErrorPreviewModalOpen, setIsErrorPreviewModalOpen] = useState(false);
    const [flowStep, setFlowStep] = useState<FlowStep | null>(null);
    const [stepToRestoreAfterCancel, setStepToRestoreAfterCancel] = useState<FlowStep | null>(null);
    const {
      setDocumentId,
      selectedContentTypes,
      setSelectedContentTypes,
      availableTabs,
      setAvailableTabs,
      selectedTabs,
      setSelectedTabs,
      hasProgress,
      resetProgress: resetProgressTracking,
      pendingCloseAction,
      setPendingCloseAction,
    } = useProgressTracking();

    useImperativeHandle(ref, () => ({
      startFlow: () => setIsUploadModalOpen(true),
    }));

    const resetProgress = () => {
      resetProgressTracking();
      setFlowStep(null);
      setIsUploadModalOpen(false);
    };

    const requestDiscardFlow = (restoreStep: FlowStep | null = null) => {
      setFlowStep(null);
      if (!hasProgress) {
        setStepToRestoreAfterCancel(null);
        return;
      }

      setStepToRestoreAfterCancel(restoreStep);
      setPendingCloseAction(() => resetProgress);
      setIsConfirmCancelModalOpen(true);
    };

    const handleUploadModalCloseRequest = (docId?: string) => {
      if (docId) {
        setDocumentId(docId);
        setIsUploadModalOpen(false);
        setFlowStep(FlowStep.CONTENT_TYPE_PICKER);
        return;
      }

      setIsUploadModalOpen(false);
      requestDiscardFlow(null);
    };

    const handleContentTypePickerCloseRequest = () => {
      requestDiscardFlow(FlowStep.CONTENT_TYPE_PICKER);
    };

    const handleConfirmCancel = () => {
      setIsConfirmCancelModalOpen(false);
      if (pendingCloseAction) {
        pendingCloseAction();
        setPendingCloseAction(null);
      }
      setStepToRestoreAfterCancel(null);
    };

    const handleKeepCreating = () => {
      setIsConfirmCancelModalOpen(false);
      setPendingCloseAction(null);
      if (stepToRestoreAfterCancel) {
        setFlowStep(stepToRestoreAfterCancel);
      }
      setStepToRestoreAfterCancel(null);
    };

    const handleContentTypeSelected = (contentTypeIdsCsv: string) => {
      // TEMP workaround: we pass content type IDs as a comma-separated string to Mastra workflows.
      // The modal already updates `selectedContentTypes` via `setSelectedContentTypes`, so we don't need to set it here.
      void contentTypeIdsCsv;
      // setSelectedContentTypes(contentTypes);
      setFlowStep(FlowStep.SELECT_TABS);
    };

    const handleSelectTabsContinue = (_selectedTabs: DocumentTabProps[]) => {
      // TODO: Replace this mock branch with Agents API run-status polling when
      // `PENDING_REVIEW` / suspend state is available in the frontend.
      if (MOCK_HAS_PENDING_IMAGES_REVIEW) {
        setFlowStep(FlowStep.INCLUDE_IMAGES);
        return;
      }

      // TODO: add preview step and redirect to it, using selectedTabs
      setFlowStep(FlowStep.LOADING);
    };

    const handleStepCancel = (step: FlowStep | null) => {
      if (!step || step === FlowStep.LOADING) return;
      requestDiscardFlow(step);
    };

    const handleIncludeImagesConfirm = (includeImages: boolean) => {
      // TODO: Wire `includeImages` into Agents resume endpoint payload once
      // suspend/resume APIs are available in the frontend.
      console.log('[ModalOrchestrator] Mock includeImages choice:', includeImages);
      setFlowStep(FlowStep.LOADING);
    };

    const handleErrorPreviewModalClose = () => {
      setIsErrorPreviewModalOpen(false);
      resetProgress();
    };

    const handleErrorPreviewModalRetry = () => {
      setIsErrorPreviewModalOpen(false);
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
          onClose={() => handleStepCancel(flowStep)}
          size={'large'}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEscapePress={flowStep !== FlowStep.LOADING}>
          {() => (
            <>
              {flowStep === FlowStep.CONTENT_TYPE_PICKER && (
                <ContentTypePickerModal
                  sdk={sdk}
                  onClose={handleContentTypePickerCloseRequest}
                  onSelect={handleContentTypeSelected}
                  selectedContentTypes={selectedContentTypes}
                  setSelectedContentTypes={setSelectedContentTypes}
                />
              )}

              {flowStep === FlowStep.SELECT_TABS && (
                <SelectTabsModal
                  onContinue={handleSelectTabsContinue}
                  onClose={() => handleStepCancel(FlowStep.SELECT_TABS)}
                  availableTabs={availableTabs}
                  setAvailableTabs={setAvailableTabs}
                  selectedTabs={selectedTabs}
                  setSelectedTabs={setSelectedTabs}
                />
              )}

              {flowStep === FlowStep.INCLUDE_IMAGES && (
                <IncludeImagesModal
                  onConfirm={handleIncludeImagesConfirm}
                  onCancel={() => handleStepCancel(FlowStep.INCLUDE_IMAGES)}
                />
              )}

              {flowStep === FlowStep.LOADING && (
                <LoadingModal
                  step="reviewingContentTypes"
                  title="Preparing your preview"
                  contentTypeCount={selectedContentTypes.length}
                />
              )}
            </>
          )}
        </Modal>

        <ConfirmCancelModal
          isOpen={isConfirmCancelModalOpen}
          onConfirm={handleConfirmCancel}
          onCancel={handleKeepCreating}
        />

        <ErrorModal
          isOpen={isErrorPreviewModalOpen}
          onClose={handleErrorPreviewModalClose}
          title="Unable to generate preview"
          message={ERROR_MESSAGES.GENERIC_ERROR}
          onTryAgain={handleErrorPreviewModalRetry}
        />
      </>
    );
  }
);

ModalOrchestrator.displayName = 'ModalOrchestrator';
