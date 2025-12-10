import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Note,
  Paragraph,
  Stack,
  Textarea,
  Text,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeSelector } from '../components';
import { createEntriesFromDocumentAction } from '../utils/appFunctionUtils';
import { GoogleDocUploader } from '../components/page/GoogleDocUploader';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [document, setDocument] = useState<{ title: string; data: unknown } | null>(null);
  const [contentTypeIds, setContentTypeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [pastedJson, setPastedJson] = useState<string>('');
  const [showPasteJson, setShowPasteJson] = useState<boolean>(false);

  const handleSubmit = async () => {
    // Validation
    const openAiApiKey = sdk.parameters.installation?.openAiApiKey as string | undefined;

    if (!openAiApiKey || !openAiApiKey.trim()) {
      setErrorMessage('OpenAI API key is not configured. Please configure it in the app settings.');
      setSuccessMessage(null);
      return;
    }

    if (!document || !document.data) {
      setErrorMessage('Please select a document');
      setSuccessMessage(null);
      return;
    }

    if (contentTypeIds.length === 0) {
      setErrorMessage('Please select at least one content type');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setResult(null);

    try {
      const response = await createEntriesFromDocumentAction(sdk, contentTypeIds, document.data);
      setResult(response);
      setSuccessMessage('Successfully created entries from document!');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create entries');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccess = (title: string, documentJson: string | null) => {
    if (!documentJson) {
      setErrorMessage('Failed to load document data');
      return;
    }
    try {
      const parsed = JSON.parse(documentJson);
      setDocument({ title, data: parsed });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to parse document JSON');
    }
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
  };

  const handlePasteJson = () => {
    if (!pastedJson || !pastedJson.trim()) {
      setErrorMessage('Please paste JSON content');
      return;
    }

    try {
      const parsed = JSON.parse(pastedJson);
      setDocument({ title: 'Pasted JSON Document', data: parsed });
      setErrorMessage(null);
      setSuccessMessage('JSON document loaded successfully');
      setPastedJson('');
      setShowPasteJson(false);
    } catch (error) {
      setErrorMessage('Invalid JSON format. Please check your JSON and try again.');
      console.error('JSON parse error:', error);
    }
  };

  return (
    <Flex flexDirection="column" alignItems="stretch">
      <Box
        padding="spacingXl"
        style={{
          width: '100%',
          maxWidth: '1120px',
          margin: '32px auto',
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
        }}>
        <Heading as="h2">Upload Document</Heading>
        <Paragraph marginBottom="spacingL">
          Upload a public Google Doc link or a document file to send for processing.
        </Paragraph>

        <Stack spacing="spacingXl" flexDirection="column" alignItems="stretch">
          <GoogleDocUploader sdk={sdk} onSuccess={handleSuccess} onError={handleError} />

          {/* Temporary: Paste JSON feature */}
          <Box>
            <Button
              variant="secondary"
              onClick={() => setShowPasteJson(!showPasteJson)}
              size="small">
              {showPasteJson ? 'Hide' : 'Paste JSON (Temporary)'}
            </Button>
            {showPasteJson && (
              <Box marginTop="spacingM">
                <Text fontSize="fontSizeS" fontColor="gray600" marginBottom="spacingS">
                  Paste your Google Docs JSON here (temporary feature)
                </Text>
                <Textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder="Paste Google Docs JSON here..."
                  rows={10}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                />
                <Box marginTop="spacingS">
                  <Button
                    variant="secondary"
                    onClick={handlePasteJson}
                    size="small"
                    isDisabled={!pastedJson || !pastedJson.trim()}>
                    Load Pasted JSON
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {document && (
            <Box>
              <Paragraph>
                <strong>Selected Document:</strong> {document.title}
              </Paragraph>
            </Box>
          )}

          <ContentTypeSelector
            sdk={sdk}
            isContentTypePickerOpen={isContentTypePickerOpen}
            setIsContentTypePickerOpen={setIsContentTypePickerOpen}
            onContentTypesSelected={setContentTypeIds}
          />

          <Box>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}>
              Create Entries from Document
            </Button>
          </Box>

          {successMessage && <Note variant="positive">{successMessage}</Note>}
          {errorMessage && <Note variant="negative">{errorMessage}</Note>}

          {result && (
            <Box
              style={{
                background: '#f7f9fa',
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #e5e5e5',
              }}>
              <Heading as="h3" marginBottom="spacingS">
                Response
              </Heading>
              <Box
                as="pre"
                style={{
                  maxHeight: '400px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}>
                {JSON.stringify(result, null, 2)}
              </Box>
            </Box>
          )}
        </Stack>
      </Box>
    </Flex>
  );
};

export default Page;
