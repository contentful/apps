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
import { usePlanGeneration } from '../hooks/usePlanGeneration';
import SelectDocumentModal from '../components/page/SelectDocumentModal';
import { ViewPreviewModal } from '../components/page/ViewPreviewModal';
import { ReviewEntriesModal } from '../components/page/ReviewEntriesModal';
import { ErrorEntriesModal } from '../components/page/ErrorEntriesModal';
import { createEntriesFromPreview, EntryCreationResult } from '../services/entryService';

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
    plan,
    isLoading: isGeneratingPlan,
    error: planError,
    generatePlan,
    clearPlan,
  } = usePlanGeneration(sdk, documentId, oauthToken);

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
    clearPlan();
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
      const entryResult: EntryCreationResult = await createEntriesFromPreview(
        sdk,
        previewEntries,
        ids
      );

      const createdCount = entryResult.createdEntries.length;
      const errorCount = entryResult.errors.length;

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
    clearPlan();
  };

  const handlePlanReviewCreateEntries = async () => {
    if (!plan) return;

    const contentTypeIds = plan.entries.map((entry) => entry.contentTypeId);
    const uniqueContentTypeIds = Array.from(new Set(contentTypeIds));

    closeModal(ModalType.PREVIEW);
    openModal(ModalType.LOADING);

    // Create entries using the plan data - pass entries to avoid re-analysis
    await submit(uniqueContentTypeIds, plan.entries);
  };

  // Close the Loading modal when submission completes
  useEffect(() => {
    const submissionJustCompleted = prevIsSubmittingRef.current && !isSubmitting;

    if (submissionJustCompleted && modalStates.isLoadingModalOpen) {
      closeModal(ModalType.LOADING);
      clearPlan();
    }

    prevIsSubmittingRef.current = isSubmitting;
  }, [isSubmitting, modalStates.isLoadingModalOpen, closeModal, clearPlan]);

  // Handle plan generation completion
  useEffect(() => {
    if (!isGeneratingPlan && plan && !planError) {
      // Close loading modal first
      if (modalStates.isLoadingModalOpen) {
        closeModal(ModalType.LOADING);
      }

      // Validate plan has required data before opening modal
      if (plan.entries && Array.isArray(plan.entries) && plan.summary) {
        // Plan generation completed successfully, open plan review modal
        if (!modalStates.isPreviewModalOpen && !modalStates.isContentTypePickerOpen) {
          openModal(ModalType.PREVIEW);
        }
      } else {
        // Invalid plan data
        sdk.notifier.error('Invalid plan data received');
        if (modalStates.isPreviewModalOpen) {
          closeModal(ModalType.PREVIEW);
        }
        openModal(ModalType.CONTENT_TYPE_PICKER);
      }
    } else if (!isGeneratingPlan && planError) {
      // Plan generation failed, close loading modal and return to content type picker
      if (modalStates.isLoadingModalOpen) {
        closeModal(ModalType.LOADING);
      }
      sdk.notifier.error(`Failed to generate plan: ${planError}`);
      if (modalStates.isPreviewModalOpen) {
        closeModal(ModalType.PREVIEW);
      }
      if (!modalStates.isContentTypePickerOpen) {
        openModal(ModalType.CONTENT_TYPE_PICKER);
      }
    }
  }, [
    isGeneratingPlan,
    plan,
    planError,
    modalStates.isLoadingModalOpen,
    modalStates.isPreviewModalOpen,
    modalStates.isContentTypePickerOpen,
    openModal,
    closeModal,
    sdk,
  ]);

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
        isOpen={modalStates.isPreviewModalOpen}
        onClose={handlePlanReviewCancel}
        onCreateEntries={handlePlanReviewCreateEntries}
        plan={plan}
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

      <ViewPreviewModal
        isOpen={modalStates.isPreviewModalOpen}
        onClose={() => closeModal(ModalType.PREVIEW)}
        entries={previewEntries}
        onConfirm={() => handlePreviewModalConfirm(selectedContentTypes)}
        isSubmitting={isCreatingEntries}
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
