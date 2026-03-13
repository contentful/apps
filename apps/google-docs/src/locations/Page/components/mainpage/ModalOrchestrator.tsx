import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { useModalManagement, ModalType } from '../../../../hooks/useModalManagement';
import { useProgressTracking } from '../../../../hooks/useProgressTracking';
import { ErrorModal } from '../modals/ErrorModal';
import SelectDocumentModal from '../modals/step_1/SelectDocumentModal';
import { ContentTypePickerModal } from '../modals/step_2/SelectContentTypeModal';
import { LoadingModal } from '../modals/LoadingModal';
import { ContentTypeProps } from 'contentful-management';
import { ERROR_MESSAGES } from '../../../../utils/constants/messages';

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
      openModal(ModalType.CONFIRM_PROMPT);
    };

    const handleConfirmPromptBack = () => {
      closeModal(ModalType.CONFIRM_PROMPT);
      openModal(ModalType.CONTENT_TYPE_PICKER);
    };

    const handleConfirmPromptConfirm = async () => {
      closeModal(ModalType.CONFIRM_PROMPT);
      const ids = selectedContentTypes.map((ct) => ct.sys.id);
      lastSubmittedContentTypeIdsRef.current = ids;
      await submit(ids);
    };

    const handlePreviewModalConfirm = async (selectedEntries: PreviewEntry[]) => {
      if (!selectedEntries || selectedEntries.length === 0) {
        sdk.notifier.error('No entries to create');
        return;
      }

      setSelectedEntriesCount(selectedEntries.length);

      // Build a map of contentTypeId -> contentTypeName from selected entries to use in the review modal
      const namesMap: Record<string, string> = {};
      selectedEntries.forEach((previewEntry) => {
        namesMap[previewEntry.entry.contentTypeId] = previewEntry.contentTypeName;
      });
      setContentTypeNamesMap(namesMap);

      closeModal(ModalType.PREVIEW);
      setIsCreatingEntries(true);
      try {
        const entries = selectedEntries.map((p) => p.entry);
        const contentTypeIds = selectedEntries.map((entry) => entry.entry.contentTypeId);
        const entryResult: EntryCreationResult = await createEntriesFromPreview(
          sdk,
          entries,
          contentTypeIds,
          assets
        );

        const createdCount = entryResult.createdEntries.length;

        if (createdCount === 0) {
          console.error('Entry creation errors:', entryResult.errors);
          openModal(ModalType.ERROR_ENTRIES);
          return;
        }

        setCreatedEntries(entryResult.createdEntries);
        resetProgress();
        openModal(ModalType.REVIEW);
      } catch (error) {
        closeModal(ModalType.PREVIEW);
        console.error('Entry creation failed:', error);
        openModal(ModalType.ERROR_ENTRIES);
      } finally {
        setIsCreatingEntries(false);
      }
    };

    const handleErrorModalTryAgain = () => {
      closeModal(ModalType.ERROR_ENTRIES);
      // Reopen the preview modal so user can try again
      openModal(ModalType.PREVIEW);
    };

    const handleErrorModalCancel = () => {
      closeModal(ModalType.ERROR_ENTRIES);
      resetProgress();
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
