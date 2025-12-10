import { useEffect, useRef } from 'react';
import { Box, Button, Card, Heading, Layout, Note } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { GettingStartedPage, UploadDocumentModal } from '../components';
import {
  ContentTypePickerModal,
  SelectedContentType,
} from '../components/page/ContentTypePickerModal';
import { ConfirmCancelModal } from '../components/page/ConfirmCancelModal';
import { ModalType } from '../utils/modalOverlayUtils';
import { useModalManagement } from '../hooks/useModalManagement';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { useDocumentSubmission } from '../hooks/useDocumentSubmission';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const { modalStates, getOverlayPropsForModal, openModal, closeModal } = useModalManagement();
  const {
    hasStarted,
    setHasStarted,
    googleDocUrl,
    setGoogleDocUrl,
    hasProgress,
    resetProgress: resetProgressTracking,
    pendingCloseAction,
    setPendingCloseAction,
  } = useProgressTracking();
  const { result, successMessage, errorMessage, submit, clearMessages, isSubmitting } =
    useDocumentSubmission(sdk, googleDocUrl);

  // Track previous submission state to detect completion
  const prevIsSubmittingRef = useRef<boolean>(false);

  const handleGetStarted = () => {
    setHasStarted(true);
    openModal(ModalType.UPLOAD);
  };

  const resetProgress = () => {
    resetProgressTracking();
    closeModal(ModalType.UPLOAD);
    closeModal(ModalType.CONTENT_TYPE_PICKER);
    clearMessages();
  };

  const handleUploadModalCloseRequest = (docUrl?: string) => {
    // If user is submitting a document (docUrl provided), proceed normally
    if (docUrl) {
      closeModal(ModalType.UPLOAD);
      setGoogleDocUrl(docUrl);
      openModal(ModalType.CONTENT_TYPE_PICKER);
      return;
    }

    // If there's progress and user is trying to cancel, show confirmation
    if (hasProgress) {
      setPendingCloseAction(() => () => {
        closeModal(ModalType.UPLOAD);
        resetProgress();
      });
      openModal(ModalType.CONFIRM_CANCEL);
    } else {
      // No progress, reset to getting started page
      closeModal(ModalType.UPLOAD);
      setHasStarted(false);
    }
  };

  const handleContentTypePickerCloseRequest = () => {
    // If there's progress, show confirmation
    if (hasProgress) {
      setPendingCloseAction(() => () => {
        closeModal(ModalType.CONTENT_TYPE_PICKER);
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
  };

  const handleContentTypeSelected = async (contentTypes: SelectedContentType[]) => {
    const names = contentTypes.map((ct) => ct.name).join(', ');
    const ids = contentTypes.map((ct) => ct.id);

    sdk.notifier.success(
      `Selected ${contentTypes.length} content type${contentTypes.length > 1 ? 's' : ''}: ${names}`
    );

    // Call create entries function after content types are selected
    await submit(ids);
  };

  // Close the ContentTypePickerModal when submission completes
  useEffect(() => {
    const submissionJustCompleted = prevIsSubmittingRef.current && !isSubmitting;

    if (submissionJustCompleted && modalStates.isContentTypePickerOpen) {
      closeModal(ModalType.CONTENT_TYPE_PICKER);
    }

    prevIsSubmittingRef.current = isSubmitting;
  }, [isSubmitting, modalStates.isContentTypePickerOpen, closeModal]);

  // Show getting started page if not started yet
  if (!hasStarted) {
    return <GettingStartedPage onSelectFile={handleGetStarted} />;
  }

  return (
    <>
      <UploadDocumentModal
        sdk={sdk}
        isOpen={modalStates.isUploadModalOpen}
        onClose={handleUploadModalCloseRequest}
        overlayProps={getOverlayPropsForModal(ModalType.UPLOAD)}
      />

      <ContentTypePickerModal
        sdk={sdk}
        isOpen={modalStates.isContentTypePickerOpen}
        onClose={handleContentTypePickerCloseRequest}
        onSelect={handleContentTypeSelected}
        overlayProps={getOverlayPropsForModal(ModalType.CONTENT_TYPE_PICKER)}
        isSubmitting={isSubmitting}
      />

      <ConfirmCancelModal
        isOpen={modalStates.isConfirmCancelModalOpen}
        onConfirm={handleConfirmCancel}
        onCancel={handleKeepCreating}
        overlayProps={getOverlayPropsForModal(ModalType.CONFIRM_CANCEL)}
      />

      {(result || successMessage || errorMessage) && (
        <Layout variant="fullscreen" withBoxShadow={true} offsetTop={10}>
          <Layout.Body>
            <Box padding="spacing2Xl">
              <Card padding="large" style={{ maxWidth: '900px', margin: '0 auto' }}>
                {successMessage && <Note variant="positive">{successMessage}</Note>}
                {errorMessage && <Note variant="negative">{errorMessage}</Note>}

                {result && (
                  <Box marginTop="spacingM">
                    <Heading as="h3" marginBottom="spacingS">
                      Response
                    </Heading>
                    <Box
                      as="pre"
                      style={{
                        maxHeight: '300px',
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0,
                        background: '#f7f9fa',
                        padding: '12px',
                        borderRadius: '4px',
                      }}>
                      {JSON.stringify(result, null, 2)}
                    </Box>
                  </Box>
                )}

                <Button
                  variant="secondary"
                  size="small"
                  onClick={resetProgress}
                  style={{ marginTop: '12px' }}>
                  Start over
                </Button>
              </Card>
            </Box>
          </Layout.Body>
        </Layout>
      )}
    </>
  );
};

export default Page;
