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
import { DocumentTabProps } from '../../../../utils/types';
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

const MOCK_HAS_PENDING_IMAGES_REVIEW = true;
const MOCK_TABS_ENABLED = true;

export const ModalOrchestrator = forwardRef<ModalOrchestratorHandle, ModalOrchestratorProps>(
  ({ sdk, oauthToken }, ref) => {
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
    const { startWorkflow, error: workflowError } = useWorkflowAgent({
      sdk,
      documentId,
      oauthToken,
    });

    const hasProgressToLose = documentId.trim().length > 0;

    useImperativeHandle(ref, () => ({
      startFlow: () => setIsUploadModalOpen(true),
    }));

    const resetProgress = () => {
      setDocumentId('');
      setSelectedContentTypes([]);
      setAvailableTabs([]);
      setSelectedTabs([]);
      setUseAllTabs(null);
      setIncludeImages(null);
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

    const handleContentTypeContinue = async (contentTypeIds: string[]) => {
      setFlowStep(FlowStep.LOADING);

      try {
        await startWorkflow(contentTypeIds);
      } catch (error) {
        // eslint-disable-next-line no-console -- developer workflow logging
        console.error('Failed to start Google Docs workflow:', error);
        setFlowStep(null);
        setIsErrorPreviewModalOpen(true);
      }
    };

    const handleSelectTabsContinue = (_selectedTabs: DocumentTabProps[]) => {
      // TODO: Replace this mock branch with Agents API run-status polling when
      // `PENDING_REVIEW` / suspend state is available in the frontend.
      if (MOCK_HAS_PENDING_IMAGES_REVIEW) {
        setFlowStep(FlowStep.INCLUDE_IMAGES);
        return;
      }

      setFlowStep(FlowStep.LOADING);
    };

    const handleIncludeImagesContinue = (includeImages: boolean) => {
      // TODO: Wire `includeImages` into Agents resume endpoint payload once
      // suspend/resume APIs are available in the frontend.
      setIncludeImages(includeImages);
      setFlowStep(FlowStep.LOADING);
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
