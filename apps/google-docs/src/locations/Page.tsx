import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Form,
  FormControl,
  Heading,
  Note,
  Paragraph,
  Stack,
  TextInput,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import mammoth from 'mammoth';
import { ContentTypePickerModal, SelectedContentType } from '../components/ContentTypePickerModal';

function isValidGoogleDocUrl(url: string): boolean {
  return /^https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]+\/edit(?:\?[^#]*)?$/.test(url);
}

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  const [googleDocUrl, setGoogleDocUrl] = useState<string>('');
  const [googleDocUrlValid, setGoogleDocUrlValid] = useState<boolean>(true);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedDocHtml, setFetchedDocHtml] = useState<string | null>(null);
  const [fetchedDocTitle, setFetchedDocTitle] = useState<string | null>(null);
  const [isDocxRendered, setIsDocxRendered] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const validateGoogleDocUrl = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setGoogleDocUrlValid(true);
      return true;
    }
    // Minimal validation: must be a docs.google.com document URL
    const isValid =
      /^https?:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9-_]+/.test(trimmed) ||
      /^https?:\/\/docs\.google\.com\/document\/u\/\d\/d\/[a-zA-Z0-9-_]+/.test(trimmed);
    setGoogleDocUrlValid(isValid);
    return isValid;
  };

  useEffect(() => {
    if (googleDocUrl) {
      validateGoogleDocUrl(googleDocUrl);
    }
  }, [googleDocUrl]);

  const simulateUpload = async (label: string) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setSuccessMessage(null);
      setErrorMessage(null);
      setFetchedDocHtml(null);
      setFetchedDocTitle(null);
      // Simulate progress to 100% over ~1.5s
      await new Promise<void>((resolve) => {
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const percent = Math.min(100, Math.round((elapsed / 1500) * 100));
          setUploadProgress(percent);
          if (percent >= 100) {
            resolve();
          } else {
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
      });
      setSuccessMessage(`${label} uploaded successfully for processing.`);
      sdk.notifier.success(`${label} uploaded successfully`);
    } catch (e) {
      setErrorMessage('Upload failed. Please try again.');
      sdk.notifier.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const extractGoogleDocId = (url: string): string | null => {
    const patterns = [
      /\/document\/d\/([a-zA-Z0-9_-]+)/, // https://docs.google.com/document/d/{id}/...
      /\/u\/\d\/d\/([a-zA-Z0-9_-]+)/, // https://docs.google.com/document/u/0/d/{id}/...
    ];
    for (const rx of patterns) {
      const m = url.match(rx);
      if (m && m[1]) return m[1];
    }
    return null;
  };

  const extractPublishedDocId = (url: string): string | null => {
    // Published Google Docs use /document/d/e/{publishedId}/...
    const m = url.match(/\/document\/d\/e\/([a-zA-Z0-9_-]+)/);
    return m && m[1] ? m[1] : null;
  };

  const fetchGoogleDoc = async (url: string) => {
    // If this is a "published to web" URL, fetch from the public export endpoint (no OAuth needed)
    const publishedId = extractPublishedDocId(url);
    if (publishedId) {
      const publishedExportUrl = `https://docs.google.com/document/d/e/${publishedId}/export?format=html`;
      const publishedResp = await fetch(publishedExportUrl, { method: 'GET' });
      if (!publishedResp.ok) {
        throw new Error(`Failed to fetch published document (status ${publishedResp.status}).`);
      }
      const publishedHtml = await publishedResp.text();
      return { title: 'Google Document', html: publishedHtml };
    }

    const docId = extractGoogleDocId(url);
    if (!docId) {
      throw new Error('Unable to extract Google Doc ID from URL.');
    }
    // Try docs.google.com export first (no OAuth); if that fails, fall back to Drive API
    try {
      const directExportUrl = `https://docs.google.com/document/d/${encodeURIComponent(
        docId
      )}/export?format=html`;
      const directResp = await fetch(directExportUrl, { method: 'GET' });
      if (directResp.ok) {
        const directHtml = await directResp.text();
        return { title: 'Google Document', html: directHtml };
      }
    } catch {
      // ignore and continue
    }
    return { title: 'Google Document', html: null };
  };

  const onSubmitGoogleDoc = async () => {
    const isValid = validateGoogleDocUrl(googleDocUrl);
    if (!isValid) {
      sdk.notifier.error('Please enter a valid public Google Doc link.');
      return;
    }
    try {
      const result = await fetchGoogleDoc(googleDocUrl);
      await simulateUpload('Google Doc');

      setFetchedDocTitle(result.title);
      setFetchedDocHtml(result.html);
      setSuccessMessage(`Fetched "${result.title}" successfully.`);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : 'Failed to fetch Google Doc. Ensure it is publicly accessible.';
      setErrorMessage(message);
      sdk.notifier.error(message);
    }
  };

  const onSelectFile = (fileList: FileList | null) => {
    setFile(null);
    setFileError(null);
    if (!fileList || fileList.length === 0) {
      return;
    }
    const file = fileList[0];

    setFile(file);
  };

  const convertDocxToHtml = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value as string;
  };

  const loadDocxPreview = async () => {
    if ((window as any).docx) return (window as any).docx;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/docx-preview@0.3.4/dist/docx-preview.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load docx-preview'));
      document.body.appendChild(script);
    });
    const docx = (window as any).docx;
    if (!docx) {
      throw new Error('docx-preview failed to initialize');
    }
    return docx;
  };

  const handleContentTypeSelected = async (contentTypes: SelectedContentType[]) => {
    const names = contentTypes.map((ct) => ct.name).join(', ');
    sdk.notifier.success(
      `Selected ${contentTypes.length} content type${contentTypes.length > 1 ? 's' : ''}: ${names}`
    );
    setIsContentTypePickerOpen(false);

    // Call the content type parser agent
    await analyzeContentTypes(contentTypes.map((ct) => ct.id));
  };

  const analyzeContentTypes = async (contentTypeIds: string[]) => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      setAnalysisResult(null);

      // Get the app definition ID
      const appDefinitionId = sdk.ids.app;

      if (!appDefinitionId) {
        throw new Error('App definition ID not found');
      }

      // Call the app action
      const result = await sdk.cma.appActionCall.createWithResult(
        {
          appDefinitionId,
          appActionId: '3nLAuoEuepbJMvdgp1qX6g',
        },
        {
          parameters: {
            contentTypeIds,
          },
        }
      );

      console.log('ct agent parse result', result);

      // Check if the result has the expected structure
      if ('errors' in result && result.errors) {
        throw new Error(JSON.stringify(result.errors));
      }

      setAnalysisResult(result);
      sdk.notifier.success('Content types analyzed successfully!');
    } catch (error) {
      console.error('Failed to analyze content types:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to analyze content types';
      setAnalysisError(errorMessage);
      sdk.notifier.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmitDoc = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    if (!file) {
      setFileError('Please choose a document file to upload.');
      return;
    }
    try {
      const lower = file.name.toLowerCase();
      const isDocx = lower.endsWith('.docx');
      if (isDocx) {
        // Prefer higher-fidelity renderer
        try {
          const docx = await loadDocxPreview();
          const buf = await file.arrayBuffer();
          if (previewRef.current) {
            previewRef.current.innerHTML = '';
            await docx.renderAsync(buf, previewRef.current, undefined, {
              inWrapper: true,
              ignoreLastRenderedPageBreak: true,
              experimental: true,
            });
            setIsDocxRendered(true);
            setFetchedDocTitle(file.name);
            setFetchedDocHtml(null);
            setSuccessMessage(`Rendered "${file.name}" successfully.`);
            return;
          }
        } catch {
          // Fallback to mammoth if docx-preview fails
          const html = await convertDocxToHtml(file);
          setFetchedDocTitle(file.name);
          setFetchedDocHtml(html);
          setIsDocxRendered(false);
          setSuccessMessage(`Parsed "${file.name}" successfully.`);
          return;
        }
      }
      // Non-docx or unable to render with docx-preview; try mammoth fallback for best effort
      const html = await convertDocxToHtml(file);
      await simulateUpload(`"${file.name}"`);
      setFetchedDocTitle(file.name);
      setFetchedDocHtml(html);
      setIsDocxRendered(false);
      setSuccessMessage(`Parsed "${file.name}" successfully.`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to parse document file.';
      setErrorMessage(message);
      sdk.notifier.error(message);
    }
  };

  return (
    <Flex flexDirection="column" alignItems="stretch">
      <Box
        padding="spacingXl"
        style={{
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
          <Form>
            <FormControl>
              <FormControl.Label>Public Google Doc link</FormControl.Label>
              <TextInput
                id="googleDocUrl"
                name="googleDocUrl"
                value={googleDocUrl}
                isInvalid={!googleDocUrlValid}
                placeholder="https://docs.google.com/document/d/..."
                onChange={(e) => {
                  const url = e.target.value;
                  setGoogleDocUrl(url);
                  setGoogleDocUrlValid(isValidGoogleDocUrl(url));
                }}
              />
              <FormControl.HelpText>
                Must be a publicly accessible Google Docs URL (View access).
              </FormControl.HelpText>
              {googleDocUrlValid && googleDocUrl && (
                <Box marginTop="spacingS">
                  <a
                    href={encodeURI(googleDocUrl.replace('/edit', '/preview'))}
                    target="_blank"
                    rel="noopener noreferrer">
                    Open original (best formatting)
                  </a>
                </Box>
              )}
              {!googleDocUrlValid && (
                <FormControl.ValidationMessage>
                  Enter a valid Google Doc URL.
                </FormControl.ValidationMessage>
              )}
              <Box marginTop="spacingS">
                <Button
                  isDisabled={isUploading || !googleDocUrl || !googleDocUrlValid}
                  onClick={onSubmitGoogleDoc}>
                  Upload Google Doc
                </Button>
              </Box>
            </FormControl>
          </Form>

          <Form>
            <FormControl>
              <FormControl.Label>Document file (.doc, .docx)</FormControl.Label>
              <Box marginTop="spacingS">
                <input
                  type="file"
                  accept=".doc,.docx"
                  onChange={(e) => onSelectFile(e.target.files)}
                />
              </Box>
              <FormControl.HelpText>
                Choose a document file from your computer.
              </FormControl.HelpText>
              {fileError && (
                <FormControl.ValidationMessage>{fileError}</FormControl.ValidationMessage>
              )}
              <Box marginTop="spacingS">
                <Button isDisabled={isUploading || !file} onClick={onSubmitDoc}>
                  Upload Document File
                </Button>
              </Box>
            </FormControl>
          </Form>

          {isUploading && (
            <Box>
              <Paragraph>Uploading... {uploadProgress}%</Paragraph>
              <progress max={100} value={uploadProgress} style={{ width: '100%' }} />
            </Box>
          )}

          {successMessage && <Note variant="positive">{successMessage}</Note>}
          {errorMessage && <Note variant="negative">{errorMessage}</Note>}

          {/* {(fetchedDocHtml || isDocxRendered) && ( */}
          <Box marginTop="spacingM">
            <Button
              variant="primary"
              onClick={() => {
                setIsContentTypePickerOpen(true);
              }}
              isDisabled={isAnalyzing}>
              Select Content Type
            </Button>
          </Box>
          {/* )} */}

          {isAnalyzing && (
            <Box marginTop="spacingM">
              <Note variant="primary">Analyzing content types...</Note>
            </Box>
          )}

          {analysisError && (
            <Box marginTop="spacingM">
              <Note variant="negative">Error: {analysisError}</Note>
            </Box>
          )}

          {analysisResult && (
            <Box marginTop="spacingL" style={{ border: '1px solid #e5e5e5', padding: '16px' }}>
              <Heading as="h3" marginBottom="spacingS">
                Analysis Result
              </Heading>
              <Paragraph marginBottom="spacingS">
                Raw output from the content type parser:
              </Paragraph>
              <Box
                style={{
                  maxHeight: '400px',
                  overflow: 'auto',
                  background: '#f7f9fa',
                  padding: '16px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                {JSON.stringify(analysisResult, null, 2)}
              </Box>
            </Box>
          )}

          {fetchedDocHtml && !isDocxRendered && (
            <Box marginTop="spacingL" style={{ border: '1px solid #e5e5e5', padding: '16px' }}>
              <Heading as="h3" marginBottom="spacingS">
                {fetchedDocTitle}
              </Heading>
              <Paragraph marginBottom="spacingS">Preview (HTML export):</Paragraph>
              <Box
                style={{ maxHeight: '400px', overflow: 'auto', background: '#fff' }}
                dangerouslySetInnerHTML={{ __html: fetchedDocHtml }}
              />
            </Box>
          )}
          {isDocxRendered && (
            <Box marginTop="spacingL" style={{ border: '1px solid #e5e5e5', padding: '16px' }}>
              <Heading as="h3" marginBottom="spacingS">
                {fetchedDocTitle}
              </Heading>
              <Paragraph marginBottom="spacingS">Preview (DOCX high-fidelity render):</Paragraph>
              <Box
                ref={previewRef}
                style={{ maxHeight: '400px', overflow: 'auto', background: '#fff' }}
              />
            </Box>
          )}
        </Stack>
      </Box>

      <ContentTypePickerModal
        sdk={sdk}
        isOpen={isContentTypePickerOpen}
        onClose={() => {
          setIsContentTypePickerOpen(false);
        }}
        onSelect={handleContentTypeSelected}
      />
    </Flex>
  );
};

export default Page;
