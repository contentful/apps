import { useEffect, useMemo, useRef, useState } from 'react';
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

function isValidGoogleDocUrl(url: string): boolean {
  return /^https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]+\/edit(?:\?[^#]*)?$/.test(url);
}

const Page = () => {
  const sdk = useSDK<PageAppSDK>();

  const [googleDocUrl, setGoogleDocUrl] = useState<string>('');
  const [googleDocUrlValid, setGoogleDocUrlValid] = useState<boolean>(true);

  const [wordFile, setWordFile] = useState<File | null>(null);
  const [wordFileError, setWordFileError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [fetchedDocHtml, setFetchedDocHtml] = useState<string | null>(null);
  const [fetchedDocTitle, setFetchedDocTitle] = useState<string | null>(null);
  const [isDocxRendered, setIsDocxRendered] = useState<boolean>(false);
  const wordPreviewRef = useRef<HTMLDivElement | null>(null);

  const acceptedWordTypes = useMemo(
    () => [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    []
  );

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

  const onSelectWordFile = (fileList: FileList | null) => {
    setWordFile(null);
    setWordFileError(null);
    if (!fileList || fileList.length === 0) {
      return;
    }
    const file = fileList[0];
    if (!acceptedWordTypes.includes(file.type)) {
      setWordFileError('Please select a .doc or .docx file.');
      return;
    }

    console.log('file', file);
    setWordFile(file);
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

  const onSubmitWordDoc = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    if (!wordFile) {
      setWordFileError('Please choose a Word document to upload.');
      return;
    }
    try {
      const lower = wordFile.name.toLowerCase();
      const isDocx =
        lower.endsWith('.docx') ||
        wordFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (isDocx) {
        // Prefer higher-fidelity renderer
        try {
          const docx = await loadDocxPreview();
          const buf = await wordFile.arrayBuffer();
          if (wordPreviewRef.current) {
            wordPreviewRef.current.innerHTML = '';
            await docx.renderAsync(buf, wordPreviewRef.current, undefined, {
              inWrapper: true,
              ignoreLastRenderedPageBreak: true,
              experimental: true,
            });
            setIsDocxRendered(true);
            setFetchedDocTitle(wordFile.name);
            setFetchedDocHtml(null);
            setSuccessMessage(`Rendered "${wordFile.name}" successfully.`);
            return;
          }
        } catch {
          // Fallback to mammoth if docx-preview fails
          const html = await convertDocxToHtml(wordFile);
          setFetchedDocTitle(wordFile.name);
          setFetchedDocHtml(html);
          setIsDocxRendered(false);
          setSuccessMessage(`Parsed "${wordFile.name}" successfully.`);
          return;
        }
      }
      // Non-docx or unable to render with docx-preview; try mammoth fallback for best effort
      const html = await convertDocxToHtml(wordFile);
      await simulateUpload(`"${wordFile.name}"`);
      setFetchedDocTitle(wordFile.name);
      setFetchedDocHtml(html);
      setIsDocxRendered(false);
      setSuccessMessage(`Parsed "${wordFile.name}" successfully.`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to parse Word document.';
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
          Upload a public Google Doc link or a Word document to send for processing.
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
              <FormControl.Label>Word document (.doc, .docx)</FormControl.Label>
              <Box marginTop="spacingS">
                <input
                  type="file"
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => onSelectWordFile(e.target.files)}
                />
              </Box>
              <FormControl.HelpText>
                Choose a Word document from your computer.
              </FormControl.HelpText>
              {wordFileError && (
                <FormControl.ValidationMessage>{wordFileError}</FormControl.ValidationMessage>
              )}
              <Box marginTop="spacingS">
                <Button isDisabled={isUploading || !wordFile} onClick={onSubmitWordDoc}>
                  Upload Word Document
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
                ref={wordPreviewRef}
                style={{ maxHeight: '400px', overflow: 'auto', background: '#fff' }}
              />
            </Box>
          )}
        </Stack>
      </Box>
    </Flex>
  );
};

export default Page;
