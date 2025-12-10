import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Form,
  FormControl,
  Modal,
  Stack,
  Text,
  Card,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { TEST_DOCUMENTS } from '../../utils/test_docs_json';

interface GoogleDocUploaderProps {
  sdk: PageAppSDK;
  onSuccess: (title: string, html: string | null) => void;
  onError: (message: string) => void;
  isDisabled?: boolean;
  onModalStateChange?: (isOpen: boolean) => void;
}

export const GoogleDocUploader = ({
  sdk,
  onSuccess,
  onError,
  isDisabled,
  onModalStateChange,
}: GoogleDocUploaderProps) => {
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Notify parent when modal state changes
  useEffect(() => {
    onModalStateChange?.(isModalOpen);
  }, [isModalOpen, onModalStateChange]);

  const handleSelectDocument = async (docId: string, title: string, documentData: any) => {
    setSelectedDocument(title);
    setIsModalOpen(false);

    try {
      setIsUploading(true);

      // Log the document data to console
      console.log('Selected document:', title);
      console.log('Document data:', documentData);

      sdk.notifier.success(`Document "${title}" loaded successfully`);

      // Proceed to content type selector with the document data
      onSuccess(title, JSON.stringify(documentData));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load document.';
      onError(message);
      sdk.notifier.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form>
      <FormControl>
        <Button
          variant="secondary"
          onClick={() => setIsModalOpen(true)}
          isDisabled={isDisabled || isUploading}>
          {selectedDocument ? 'Change Document' : 'Select Document'}
        </Button>

        {selectedDocument && (
          <Box marginTop="spacingS">
            <Text fontWeight="fontWeightDemiBold">Selected: {selectedDocument}</Text>
          </Box>
        )}

        {isUploading && (
          <Box marginTop="spacingS">
            <Text fontColor="gray500" fontSize="fontSizeS">
              Processing document...
            </Text>
          </Box>
        )}

        <FormControl.HelpText>
          Choose a test document to process with the agent
        </FormControl.HelpText>
      </FormControl>

      <Modal onClose={() => setIsModalOpen(false)} isShown={isModalOpen} size="large">
        {() => (
          <>
            <Modal.Header title="Select a Test Document" onClose={() => setIsModalOpen(false)} />
            <Modal.Content>
              <Stack flexDirection="column" spacing="spacingS">
                {TEST_DOCUMENTS.map((doc, index) => (
                  <Card
                    key={index}
                    as="button"
                    onClick={() => handleSelectDocument(doc.id, doc.title, doc.data)}
                    style={{ cursor: 'pointer', textAlign: 'left', padding: '12px' }}>
                    <Stack flexDirection="column" spacing="spacingXs">
                      <Text fontWeight="fontWeightDemiBold">{doc.title}</Text>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Modal.Content>
          </>
        )}
      </Modal>
    </Form>
  );
};
