import { useRef, useState } from 'react';
import { Box, Flex, Heading, Note, Paragraph, Stack } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  GoogleDocUploader,
  DocumentFileUploader,
  ContentTypeSelector,
  DocumentPreview,
} from '../components';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedDocHtml, setFetchedDocHtml] = useState<string | null>(null);
  const [fetchedDocTitle, setFetchedDocTitle] = useState<string | null>(null);
  const [isDocxRendered, setIsDocxRendered] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const handleGoogleDocSuccess = (title: string, html: string | null) => {
    setFetchedDocTitle(title);
    setFetchedDocHtml(html);
    setIsDocxRendered(false);
    setSuccessMessage(`Fetched "${title}" successfully.`);
    setErrorMessage(null);
  };

  const handleDocumentFileSuccess = (
    title: string,
    html: string | null,
    isDocxRendered: boolean
  ) => {
    setFetchedDocTitle(title);
    setFetchedDocHtml(html);
    setIsDocxRendered(isDocxRendered);
    setSuccessMessage(`${isDocxRendered ? 'Rendered' : 'Uploaded'} "${title}" successfully.`);
    setErrorMessage(null);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage(null);
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
        <Heading as="h2">Document Uploader</Heading>
        <Paragraph marginBottom="spacingL">
          Upload a public Google Doc link or a document file to send for processing.
        </Paragraph>

        <Stack spacing="spacingXl" flexDirection="column" alignItems="stretch">
          <GoogleDocUploader sdk={sdk} onSuccess={handleGoogleDocSuccess} onError={handleError} />

          <DocumentFileUploader
            sdk={sdk}
            onSuccess={handleDocumentFileSuccess}
            onError={handleError}
            previewRef={previewRef}
          />

          <ContentTypeSelector sdk={sdk} />

          {successMessage && <Note variant="positive">{successMessage}</Note>}
          {errorMessage && <Note variant="negative">{errorMessage}</Note>}

          <DocumentPreview
            title={fetchedDocTitle}
            html={fetchedDocHtml}
            isDocxRendered={isDocxRendered}
            previewRef={previewRef}
          />
        </Stack>
      </Box>
    </Flex>
  );
};

export default Page;
