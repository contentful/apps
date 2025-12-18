import { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, Heading, Layout, Note } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { GettingStartedPage } from '../components/page/GettingStartedPage';
import {
  ContentTypePickerModal,
  SelectedContentType,
} from '../components/page/ContentTypePickerModal';
import { ConfirmCancelModal } from '../components/page/ConfirmCancelModal';
import { useModalManagement, ModalType } from '../hooks/useModalManagement';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { useDocumentSubmission } from '../hooks/useDocumentSubmission';
import SelectDocumentModal from '../components/page/SelectDocumentModal';
import { ViewPreviewModal } from '../components/page/ViewPreviewModal';
import { createEntriesAction } from '../utils/appActionUtils';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const { modalStates, openModal, closeModal } = useModalManagement();
  const [oauthToken, setOauthToken] = useState<string>('');
  const [isCreatingEntries, setIsCreatingEntries] = useState<boolean>(false);
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
  const { previewEntries, submit, clearMessages, isSubmitting } = useDocumentSubmission(
    sdk,
    documentId,
    oauthToken
  );

  // Track previous submission state to detect completion
  const prevIsSubmittingRef = useRef<boolean>(false);

  const handleOauthTokenChange = (token: string) => {
    setOauthToken(token);
  };

  const handleGetStarted = () => {
    openModal(ModalType.UPLOAD);
  };

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

  const handleContentTypeSelected = async (contentTypes: SelectedContentType[]) => {
    const ids = contentTypes.map((ct) => ct.id);

    // Call create entries function after content types are selected
    await submit(ids);
  };

  const handlePreviewModalConfirm = async (contentTypes: SelectedContentType[]) => {
    if (!previewEntries || previewEntries.length === 0) {
      sdk.notifier.error('No entries to create');
      return;
    }

    setIsCreatingEntries(true);
    try {
      const ids = contentTypes.map((ct) => ct.id);
      const entryResult: any = await createEntriesAction(sdk, previewEntries, ids);

      if (entryResult.errorCount > 0) {
        sdk.notifier.warning(
          `Created ${entryResult.createdCount} entries with ${entryResult.errorCount} errors`
        );
        console.error('Entry creation errors:', entryResult.errors);
      } else {
        sdk.notifier.success(`Successfully created ${entryResult.createdCount} entries`);
      }

      // Close the preview modal and reset progress after creating entries
      closeModal(ModalType.PREVIEW);
      resetProgress();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      sdk.notifier.error(`Failed to create entries: ${errorMessage}`);
      console.error('Entry creation failed:', error);
    } finally {
      setIsCreatingEntries(false);
    }
  };

  // Close the ContentTypePickerModal when submission completes and open preview modal
  useEffect(() => {
    const submissionJustCompleted = prevIsSubmittingRef.current && !isSubmitting;

    if (submissionJustCompleted && modalStates.isContentTypePickerOpen) {
      console.log('Document processing completed, previewEntries:', previewEntries);
      closeModal(ModalType.CONTENT_TYPE_PICKER);

      // Open preview modal if we have entries
      if (previewEntries && previewEntries.length > 0) {
        console.log('Opening preview modal with', previewEntries.length, 'entries');
        openModal(ModalType.PREVIEW);
      }
    }

    prevIsSubmittingRef.current = isSubmitting;
  }, [isSubmitting, modalStates.isContentTypePickerOpen, closeModal, openModal, previewEntries]);

  return (
    <>
      <GettingStartedPage
        oauthToken={oauthToken}
        onOauthTokenChange={handleOauthTokenChange}
        onSelectFile={handleGetStarted}
      />
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

      <ViewPreviewModal
        isOpen={modalStates.isPreviewModalOpen}
        onClose={() => closeModal(ModalType.PREVIEW)}
        entries={previewEntries}
        onConfirm={() => handlePreviewModalConfirm(selectedContentTypes)}
        isSubmitting={isCreatingEntries}
      />
    </>
  );
};

export default Page;
