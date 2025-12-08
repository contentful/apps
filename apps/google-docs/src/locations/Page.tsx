import { useState } from 'react';
import { Box, Button, Heading, Note } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { GettingStartedPage, UploadDocumentModal } from '../components';
import {
  ContentTypePickerModal,
  SelectedContentType,
} from '../components/page/ContentTypePickerModal';
import { createEntriesFromDocumentAction } from '../utils/appFunctionUtils';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [googleDocUrl, setGoogleDocUrl] = useState<string>('');
  const [contentTypeIds, setContentTypeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleGetStarted = () => {
    setHasStarted(true);
    setIsUploadModalOpen(true);
  };

  const handleUploadModalClose = (docUrl?: string) => {
    setIsUploadModalOpen(false);
    if (docUrl) {
      setGoogleDocUrl(docUrl);
      // Automatically open content type picker after document is selected
      setIsContentTypePickerOpen(true);
    }
  };

  const handleContentTypeSelected = async (contentTypes: SelectedContentType[]) => {
    const names = contentTypes.map((ct) => ct.name).join(', ');
    const ids = contentTypes.map((ct) => ct.id);

    setContentTypeIds(ids);
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
      <UploadDocumentModal sdk={sdk} isOpen={isUploadModalOpen} onClose={handleUploadModalClose} />

      <ContentTypePickerModal
        sdk={sdk}
        isOpen={isContentTypePickerOpen}
        onClose={() => setIsContentTypePickerOpen(false)}
        onSelect={handleContentTypeSelected}
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
