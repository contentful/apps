import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Note,
  Paragraph,
  Stack,
  TextInput,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeSelector } from '../components';
import { createEntriesFromDocumentAction } from '../utils/appFunctionUtils';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [googleDocUrl, setGoogleDocUrl] = useState<string>(
    'https://docs.google.com/document/d/1uTBhG6ojUU_epNPFV1qKGIb506YAf3ii/edit?usp=drive_link&ouid=100613518827458188455&rtpof=true&sd=true'
  );
  const [contentTypeIds, setContentTypeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    // Validation
    if (!googleDocUrl.trim()) {
      setErrorMessage('Please enter a Google Doc URL');
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
      const response = await createEntriesFromDocumentAction(sdk, contentTypeIds, googleDocUrl);
      setResult(response);
      setSuccessMessage('Successfully created entries from document!');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create entries');
    } finally {
      setIsSubmitting(false);
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
          <Box>
            <TextInput
              value={googleDocUrl}
              onChange={(e) => setGoogleDocUrl(e.target.value)}
              placeholder="Enter Google Doc URL (e.g., https://docs.google.com/document/d/...)"
              name="googleDocUrl"
            />
          </Box>

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
