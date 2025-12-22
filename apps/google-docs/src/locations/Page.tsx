import { useEffect, useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { GettingStartedPage } from '../components/page/GettingStartedPage';
import {
  ContentTypePickerModal,
  SelectedContentType,
} from '../components/page/ContentTypePickerModal';
import { ConfirmCancelModal } from '../components/page/ConfirmCancelModal';
import { PreviewModal } from '../components/page/PreviewModal';
import { LoadingModal } from '../components/page/LoadingModal';
import { useModalManagement, ModalType } from '../hooks/useModalManagement';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { useDocumentSubmission } from '../hooks/useDocumentSubmission';
import { usePreviewGeneration } from '../hooks/usePreviewGeneration';
import SelectDocumentModal from '../components/page/SelectDocumentModal';
import { ReviewEntriesModal } from '../components/page/ReviewEntriesModal';
import { ErrorEntriesModal } from '../components/page/ErrorEntriesModal';
import { createEntriesFromPreview, EntryCreationResult } from '../services/entryService';

interface EntryToCreate {
  contentTypeId: string;
  fields: Record<string, Record<string, any>>;
}

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const { modalStates, openModal, closeModal } = useModalManagement();
  const [oauthToken, setOauthToken] = useState<string>('');
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
  const { previewEntries, successMessage, errorMessage, submit, clearMessages, isSubmitting } =
    useDocumentSubmission(sdk, documentId, oauthToken);
  const {
    preview,
    isLoading: isGeneratingPlan,
    error: planError,
    generatePreview,
  } = usePreviewGeneration(sdk, documentId, oauthToken);

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
    closeModal(ModalType.PREVIEW);
    closeModal(ModalType.LOADING);
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
    // Close content type picker and open loading modal
    closeModal(ModalType.CONTENT_TYPE_PICKER);
    openModal(ModalType.LOADING);
    await generatePreview(ids);
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

  const handlePlanReviewCancel = () => {
    closeModal(ModalType.PREVIEW);
    openModal(ModalType.CONTENT_TYPE_PICKER);
  };

  const handlePreviewModalConfirm = async (contentTypes: SelectedContentType[]) => {
    if (!preview || !preview.entries || preview.entries.length === 0) {
      sdk.notifier.error('No entries to create');
      return;
    }

    setIsCreatingEntries(true);
    try {
      const ids = contentTypes.map((ct) => ct.id);
      const entryResult: EntryCreationResult = await createEntriesFromPreview(
        sdk,
        preview.entries,
        ids
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Entry creation failed:', error);
      openModal(ModalType.ERROR_ENTRIES);
    } finally {
      setIsCreatingEntries(false);
    }
  };

  // Track previous plan generation state to detect completion
  const prevIsGeneratingPlanRef = useRef<boolean>(false);

  // Handle plan generation completion
  useEffect(() => {
    const planGenerationJustCompleted = prevIsGeneratingPlanRef.current && !isGeneratingPlan;

    if (planGenerationJustCompleted) {
      // Close loading modal if it's open
      if (modalStates.isLoadingModalOpen) {
        closeModal(ModalType.LOADING);
      }

      if (preview && !planError) {
        // Plan generation completed successfully, open preview modal
        if (preview.entries && Array.isArray(preview.entries) && preview.summary) {
          openModal(ModalType.PREVIEW);
        } else {
          // Invalid preview data
          sdk.notifier.error('Invalid preview data received');
          openModal(ModalType.CONTENT_TYPE_PICKER);
        }
      } else if (planError) {
        // Plan generation failed, show error and return to content type picker
        sdk.notifier.error(`Failed to generate preview: ${planError}`);
        openModal(ModalType.CONTENT_TYPE_PICKER);
      }
    }

    prevIsGeneratingPlanRef.current = isGeneratingPlan;
  }, [
    isGeneratingPlan,
    preview,
    planError,
    modalStates.isLoadingModalOpen,
    closeModal,
    openModal,
    sdk,
  ]);

  // Close the Loading modal when submission completes
  useEffect(() => {
    const submissionJustCompleted = prevIsSubmittingRef.current && !isSubmitting;

    if (submissionJustCompleted && modalStates.isLoadingModalOpen) {
      closeModal(ModalType.LOADING);
    }

    prevIsSubmittingRef.current = isSubmitting;
  }, [isSubmitting, modalStates.isLoadingModalOpen, closeModal]);

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
        isGeneratingPlan={isGeneratingPlan}
        selectedContentTypes={selectedContentTypes}
        setSelectedContentTypes={setSelectedContentTypes}
      />

      <PreviewModal
        sdk={sdk}
        isOpen={modalStates.isPreviewModalOpen}
        onClose={handlePlanReviewCancel}
        onCreateEntries={handlePreviewModalConfirm}
        preview={preview}
        isCreatingEntries={isCreatingEntries}
        isLoading={isGeneratingPlan}
      />

      <LoadingModal
        isOpen={modalStates.isLoadingModalOpen}
        message={isGeneratingPlan ? 'Generating plan...' : 'Creating entries...'}
      />

      <ConfirmCancelModal
        isOpen={modalStates.isConfirmCancelModalOpen}
        onConfirm={handleConfirmCancel}
        onCancel={handleKeepCreating}
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
};

export default Page;
