import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { useModalManagement, ModalType } from '../../../../hooks/useModalManagement';
import { useProgressTracking } from '../../../../hooks/useProgressTracking';
import { useGeneratePreview } from '../../../../hooks/useGeneratePreview';
import { ReviewEntriesModal } from '../modals/step_4/ReviewEntriesModal';
import { ErrorEntriesModal } from '../modals/step_4/ErrorEntriesModal';
import { createEntriesFromPreview, EntryCreationResult } from '../../../../services/entryService';
import SelectDocumentModal from '../modals/step_1/SelectDocumentModal';
import { ContentTypePickerModal } from '../modals/step_2/SelectContentTypeModal';
import { PreviewModal } from '../modals/step_3/PreviewModal';
import { ContentTypeProps } from 'contentful-management';

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
    const [isCreatingEntries, setIsCreatingEntries] = useState<boolean>(false);
    const [createdEntries, setCreatedEntries] = useState<EntryCreationResult['createdEntries']>([]);
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
    const { previewEntries, assets, submit, clearMessages, isSubmitting } = useGeneratePreview({
      sdk,
      documentId,
      oauthToken,
    });

    // Track previous submission state to detect completion
    const prevIsSubmittingRef = useRef<boolean>(false);

    // Expose startFlow method to parent
    useImperativeHandle(ref, () => ({
      startFlow: () => openModal(ModalType.UPLOAD),
    }));

    const resetProgress = () => {
      resetProgressTracking();
      closeModal(ModalType.UPLOAD);
      closeModal(ModalType.CONTENT_TYPE_PICKER);
      clearMessages();
    };

    const handleUploadModalCloseRequest = (docId?: string) => {
      // If docId is provided, user clicked "Next" - save document ID and proceed to content type picker
      if (docId) {
        setDocumentId(docId);
        closeModal(ModalType.UPLOAD);
        openModal(ModalType.CONTENT_TYPE_PICKER);
        return;
      }

      // User clicked "Cancel" - If there's progress and user is trying to cancel, show confirmation
      if (hasProgress) {
        closeModal(ModalType.UPLOAD);
        setPendingCloseAction(() => () => {
          resetProgress();
        });
        openModal(ModalType.CONFIRM_CANCEL);
      } else {
        // No progress, reset to getting started page
        closeModal(ModalType.UPLOAD);
      }
    };

    const handleContentTypePickerCloseRequest = () => {
      // If there's progress, show confirmation
      if (hasProgress) {
        closeModal(ModalType.CONTENT_TYPE_PICKER);
        setPendingCloseAction(() => () => {
          resetProgress();
        });
        openModal(ModalType.CONFIRM_CANCEL);
      } else {
        // No progress, close directly
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

    const handleContentTypeSelected = async (contentTypes: ContentTypeProps[]) => {
      const ids = contentTypes.map((ct) => ct.sys.id);
      await submit(ids);
    };

    const handlePreviewModalConfirm = async (contentTypeIds: string[]) => {
      if (!previewEntries || previewEntries.length === 0) {
        sdk.notifier.error('No entries to create');
        return;
      }
      setIsCreatingEntries(true);
      try {
        const entries = previewEntries.map((p) => p.entry);
        const entryResult: EntryCreationResult = await createEntriesFromPreview(
          sdk,
          entries,
          contentTypeIds,
          assets
        );

        const createdCount = entryResult.createdEntries.length;

        closeModal(ModalType.PREVIEW);

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

    // Close the ContentTypePickerModal when submission completes and open preview modal
    useEffect(() => {
      const submissionJustCompleted = prevIsSubmittingRef.current && !isSubmitting;

      if (submissionJustCompleted && modalStates.isContentTypePickerOpen && previewEntries) {
        console.log('Document processing completed, previewEntries:', previewEntries);
        closeModal(ModalType.CONTENT_TYPE_PICKER);

        // Open preview modal if we have entries
        if (previewEntries.length > 0) {
          openModal(ModalType.PREVIEW);
        }
      }

      prevIsSubmittingRef.current = isSubmitting;
    }, [isSubmitting, modalStates.isContentTypePickerOpen, closeModal, openModal, previewEntries]);

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

        <PreviewModal
          isOpen={modalStates.isPreviewModalOpen}
          onClose={() => closeModal(ModalType.PREVIEW)}
          previewEntries={previewEntries}
          onCreateEntries={() =>
            handlePreviewModalConfirm(selectedContentTypes.map((ct) => ct.sys.id))
          }
          isLoading={isSubmitting}
          isCreatingEntries={isCreatingEntries}
        />

        <ReviewEntriesModal
          isOpen={modalStates.isReviewModalOpen}
          onClose={() => closeModal(ModalType.REVIEW)}
          createdEntries={createdEntries}
          spaceId={sdk.ids.space}
          defaultLocale={sdk.locales.default}
        />

        <ErrorEntriesModal
          isOpen={modalStates.isErrorEntriesModalOpen}
          onClose={handleErrorModalCancel}
          onTryAgain={handleErrorModalTryAgain}
        />
      </>
    );
  }
);

ModalOrchestrator.displayName = 'ModalOrchestrator';
