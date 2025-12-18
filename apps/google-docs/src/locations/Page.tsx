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

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const { modalStates, openModal, closeModal } = useModalManagement();
  const [oauthToken, setOauthToken] = useState<string>('');
  const {
    hasStarted,
    setHasStarted,
    documentId,
    setDocumentId,
    selectedContentTypes,
    setSelectedContentTypes,
    hasProgress,
    resetProgress: resetProgressTracking,
    pendingCloseAction,
    setPendingCloseAction,
  } = useProgressTracking();
  const { result, successMessage, errorMessage, submit, clearMessages, isSubmitting } =
    useDocumentSubmission(sdk, documentId, oauthToken);

  // Track previous submission state to detect completion
  const prevIsSubmittingRef = useRef<boolean>(false);

  const handleOauthTokenChange = (token: string) => {
    setOauthToken(token);
  };

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
      setHasStarted(false);
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
    const names = contentTypes.map((ct) => ct.name).join(', ');
    const ids = contentTypes.map((ct) => ct.id);

    sdk.notifier.success(
      `Selected ${contentTypes.length} content type${contentTypes.length > 1 ? 's' : ''}: ${names}`
    );

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
    return (
      <GettingStartedPage
        oauthToken={oauthToken}
        onOauthTokenChange={handleOauthTokenChange}
        onSelectFile={handleGetStarted}
      />
    );
  }

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
