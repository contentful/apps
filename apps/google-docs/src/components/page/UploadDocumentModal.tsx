import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Modal,
  Note,
  Paragraph,
  Stack,
  TextInput,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { GoogleDocUploader } from './GoogleDocUploader';

interface UploadDocumentModalProps {
  sdk: PageAppSDK;
  isOpen: boolean;
  onClose: (googleDocUrl?: string) => void;
}

export const UploadDocumentModal = ({ sdk, isOpen, onClose }: UploadDocumentModalProps) => {
  const [googleDocUrl, setGoogleDocUrl] = useState<string>(
    'https://docs.google.com/document/d/1uTBhG6ojUU_epNPFV1qKGIb506YAf3ii/edit?usp=drive_link&ouid=100613518827458188455&rtpof=true&sd=true'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleSuccess = (title: string, html: string | null) => {
    setGoogleDocUrl(html || '');
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
  };

  const handleNext = () => {
    if (!googleDocUrl.trim()) {
      setErrorMessage('Please enter a Google Doc URL or select a test document');
      return;
    }
    setErrorMessage(null);
    // Pass the document URL back to parent and close
    onClose(googleDocUrl);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal onClose={handleCancel} isShown={isOpen} size="large">
      {() => (
        <>
          <Modal.Header title="Upload Document" onClose={handleCancel} />
          <Modal.Content>
            <Paragraph marginBottom="spacingL">
              Upload a public Google Doc link or a document file to send for processing.
            </Paragraph>

            <Stack spacing="spacingL" flexDirection="column" alignItems="stretch">
              <GoogleDocUploader sdk={sdk} onSuccess={handleSuccess} onError={handleError} />

              <Box>
                <TextInput
                  value={googleDocUrl}
                  onChange={(e) => setGoogleDocUrl(e.target.value)}
                  placeholder="Enter Google Doc URL (e.g., https://docs.google.com/document/d/...)"
                  name="googleDocUrl"
                />
              </Box>

              {errorMessage && <Note variant="negative">{errorMessage}</Note>}

              <Flex gap="spacingS" justifyContent="flex-end">
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleNext}>
                  Next
                </Button>
              </Flex>
            </Stack>
          </Modal.Content>
        </>
      )}
    </Modal>
  );
};
