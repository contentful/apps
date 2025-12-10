import { useState, useMemo } from 'react';
import { Box, Button, Heading, Note } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { GettingStartedPage, UploadDocumentModal } from '../components';
import {
  ContentTypePickerModal,
  SelectedContentType,
} from '../components/page/ContentTypePickerModal';
import { ConfirmCancelModal } from '../components/page/ConfirmCancelModal';
import { createEntriesFromDocumentAction } from '../utils/appFunctionUtils';
import { getOverlayProps, ModalType } from '../utils/modalOverlayUtils';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState<boolean>(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);
  const [googleDocUrl, setGoogleDocUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleGetStarted = () => {
    setHasStarted(true);
    setIsUploadModalOpen(true);
  };

  const hasProgress = () => {
    // User has progress if they've selected a document (googleDocUrl is set)
    return hasStarted && googleDocUrl.trim().length > 0;
  };

  const handleUploadModalCloseRequest = (docUrl?: string) => {
    // If user is submitting a document (docUrl provided), proceed normally
    if (docUrl) {
      setIsUploadModalOpen(false);
      setGoogleDocUrl(docUrl);
      setIsContentTypePickerOpen(true);
      return;
    }

    // If there's progress and user is trying to cancel, show confirmation
    if (hasProgress()) {
      setPendingCloseAction(() => () => {
        setIsUploadModalOpen(false);
        resetProgress();
      });
      setIsConfirmCancelModalOpen(true);
    } else {
      // No progress, reset to getting started page
      setIsUploadModalOpen(false);
      setHasStarted(false);
    }
  };

  const handleContentTypePickerCloseRequest = () => {
    // If there's progress, show confirmation
    if (hasProgress()) {
      setPendingCloseAction(() => () => {
        setIsContentTypePickerOpen(false);
        resetProgress();
      });
      setIsConfirmCancelModalOpen(true);
    } else {
      // No progress, close directly
      setIsContentTypePickerOpen(false);
    }
  };

  const resetProgress = () => {
    setHasStarted(false);
    setGoogleDocUrl('');
    setIsUploadModalOpen(false);
    setIsContentTypePickerOpen(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    setResult(null);
  };

  const handleConfirmCancel = () => {
    setIsConfirmCancelModalOpen(false);
    if (pendingCloseAction) {
      pendingCloseAction();
      setPendingCloseAction(null);
    }
  };

  const handleKeepCreating = () => {
    setIsConfirmCancelModalOpen(false);
    setPendingCloseAction(null);
  };

  // Determine which modal is topmost (should show overlay)
  // Priority: ConfirmCancelModal > ContentTypePickerModal > UploadDocumentModal
  const topmostModal = useMemo(() => {
    if (isConfirmCancelModalOpen) return ModalType.CONFIRM_CANCEL;
    if (isContentTypePickerOpen) return ModalType.CONTENT_TYPE_PICKER;
    if (isUploadModalOpen) return ModalType.UPLOAD;
    return null;
  }, [isUploadModalOpen, isContentTypePickerOpen, isConfirmCancelModalOpen]);

  const handleContentTypeSelected = async (contentTypes: SelectedContentType[]) => {
    const names = contentTypes.map((ct) => ct.name).join(', ');
    const ids = contentTypes.map((ct) => ct.id);

    setIsContentTypePickerOpen(false);

    sdk.notifier.success(
      `Selected ${contentTypes.length} content type${contentTypes.length > 1 ? 's' : ''}: ${names}`
    );

    // Call create entries function after content types are selected
    await handleSubmit(ids);
  };

  const handleSubmit = async (selectedContentTypeIds: string[]) => {
    // Validation
    const openAiApiKey = sdk.parameters.installation?.openAiApiKey as string | undefined;

    if (!openAiApiKey || !openAiApiKey.trim()) {
      setErrorMessage('OpenAI API key is not configured. Please configure it in the app settings.');
      setSuccessMessage(null);
      return;
    }

    if (!googleDocUrl || !googleDocUrl.trim()) {
      setErrorMessage('Please select a document');
      setSuccessMessage(null);
      return;
    }

    if (selectedContentTypeIds.length === 0) {
      setErrorMessage('Please select at least one content type');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setResult(null);

    try {
      const response = await createEntriesFromDocumentAction(
        sdk,
        selectedContentTypeIds,
        googleDocUrl
      );
      setResult(response);
      setSuccessMessage('Successfully created entries from document!');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create entries');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show getting started page if not started yet
  if (!hasStarted) {
    return <GettingStartedPage onSelectFile={handleGetStarted} />;
  }

  return (
    <>
      <UploadDocumentModal
        sdk={sdk}
        isOpen={isUploadModalOpen}
        onClose={handleUploadModalCloseRequest}
        overlayProps={getOverlayProps(topmostModal === ModalType.UPLOAD)}
      />

      <ContentTypePickerModal
        sdk={sdk}
        isOpen={isContentTypePickerOpen}
        onClose={handleContentTypePickerCloseRequest}
        onSelect={handleContentTypeSelected}
        overlayProps={getOverlayProps(topmostModal === ModalType.CONTENT_TYPE_PICKER)}
      />

      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={handleConfirmCancel}
        onCancel={handleKeepCreating}
        overlayProps={getOverlayProps(topmostModal === ModalType.CONFIRM_CANCEL)}
      />

      {(result || successMessage || errorMessage) && (
        <Box
          padding="spacingXl"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            maxWidth: '600px',
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
          }}>
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
            onClick={() => {
              setResult(null);
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            style={{ marginTop: '12px' }}>
            Close
          </Button>
        </Box>
      )}
    </>
  );
};

export default Page;
