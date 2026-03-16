import { forwardRef, useImperativeHandle, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { useModalManagement, ModalType } from '../../../../hooks/useModalManagement';
import { useProgressTracking } from '../../../../hooks/useProgressTracking';
import { ErrorModal } from '../modals/ErrorModal';
import SelectDocumentModal from '../modals/step_1/SelectDocumentModal';
import { ContentTypePickerModal } from '../modals/step_2/SelectContentTypeModal';
import { LoadingModal } from '../modals/LoadingModal';
import { ERROR_MESSAGES } from '../../../../utils/constants/messages';
import { SelectTabsModal, type DocumentTabProps } from '../modals/step_3/SelectTabsModal';

export interface ModalOrchestratorHandle {
  startFlow: () => void;
}

interface ModalOrchestratorProps {
  sdk: PageAppSDK;
  oauthToken: string;
}

export const ModalOrchestrator = forwardRef<ModalOrchestratorHandle, ModalOrchestratorProps>(
  ({ sdk, oauthToken }, ref) => {
    const { modalStates, openModal, closeModal } = useModalManagement();
    const {
      documentId,
      setDocumentId,
      selectedContentTypes,
      setSelectedContentTypes,
      hasProgress,
      resetProgress: resetProgressTracking,
      pendingCloseAction,
      setPendingCloseAction,
    } = useProgressTracking();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useImperativeHandle(ref, () => ({
      startFlow: () => openModal(ModalType.UPLOAD),
    }));

    const resetProgress = () => {
      resetProgressTracking();
      closeModal(ModalType.UPLOAD);
      closeModal(ModalType.CONTENT_TYPE_PICKER);
    };

    const handleUploadModalCloseRequest = (docId?: string) => {
      if (docId) {
        setDocumentId(docId);
        closeModal(ModalType.UPLOAD);
        openModal(ModalType.CONTENT_TYPE_PICKER);
        return;
      }

      if (hasProgress) {
        closeModal(ModalType.UPLOAD);
        setPendingCloseAction(() => () => {
          resetProgress();
        });
        openModal(ModalType.CONFIRM_CANCEL);
      } else {
        closeModal(ModalType.UPLOAD);
      }
    };

    const handleContentTypePickerCloseRequest = () => {
      if (hasProgress) {
        closeModal(ModalType.CONTENT_TYPE_PICKER);
        setPendingCloseAction(() => () => {
          resetProgress();
        });
        openModal(ModalType.CONFIRM_CANCEL);
      } else {
        closeModal(ModalType.CONTENT_TYPE_PICKER);
      }
    };

    const handleConfirmCancel = () => {
      closeModal(ModalType.CONFIRM_CANCEL);
      if (pendingCloseAction) {
        pendingCloseAction();
        setPendingCloseAction(null);
      }
    };

    const handleKeepCreating = () => {
      closeModal(ModalType.CONFIRM_CANCEL);
      setPendingCloseAction(null);
      openModal(ModalType.CONTENT_TYPE_PICKER);
    };

    const handleContentTypeSelected = (contentTypeIdsCsv: string) => {
      closeModal(ModalType.CONTENT_TYPE_PICKER);
      // TEMP workaround: we pass content type IDs as a comma-separated string to Mastra workflows.
      // The modal already updates `selectedContentTypes` via `setSelectedContentTypes`, so we don't need to set it here.
      void contentTypeIdsCsv;
      // setSelectedContentTypes(contentTypes);
      openModal(ModalType.SELECT_TABS);
    };

    const handleSelectTabsContinue = (_selectedTabs: DocumentTabProps[]) => {
      closeModal(ModalType.SELECT_TABS);
      // TODO: add preview step and redirect to it, using selectedTabs
    };

    const handleSelectTabsBack = () => {
      closeModal(ModalType.SELECT_TABS);
      openModal(ModalType.CONTENT_TYPE_PICKER);
    };

    const handleErrorPreviewModalClose = () => {
      closeModal(ModalType.ERROR_PREVIEW);
      resetProgress();
    };

    const handleErrorPreviewModalRetry = async () => {
      closeModal(ModalType.ERROR_PREVIEW);
    };

    return (
      <>
        <SelectDocumentModal
          oauthToken={oauthToken}
          isOpen={modalStates.isUploadModalOpen}
          onClose={handleUploadModalCloseRequest}
        />

        <ContentTypePickerModal
          sdk={sdk}
          isOpen={modalStates.isContentTypePickerOpen}
          onClose={handleContentTypePickerCloseRequest}
          onSelect={handleContentTypeSelected}
          isSubmitting={isSubmitting}
          selectedContentTypes={selectedContentTypes}
          setSelectedContentTypes={setSelectedContentTypes}
        />

        <SelectTabsModal
          sdk={sdk}
          isOpen={modalStates.isSelectTabsModalOpen}
          onBack={handleSelectTabsBack}
          onContinue={handleSelectTabsContinue}
          onClose={() => closeModal(ModalType.SELECT_TABS)}
        />

        <ConfirmCancelModal
          isOpen={modalStates.isConfirmCancelModalOpen}
          onConfirm={handleConfirmCancel}
          onCancel={handleKeepCreating}
        />

        <LoadingModal
          isOpen={isSubmitting}
          step="reviewingContentTypes"
          title="Preparing your preview"
          contentTypeCount={selectedContentTypes.length}
        />

        <ErrorModal
          isOpen={modalStates.isErrorPreviewModalOpen}
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
