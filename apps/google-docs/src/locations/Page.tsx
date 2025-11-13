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

declare global {
  interface Window {
    mammoth?: any;
  }
}

/*
 * INTEG-3258: Page Component - Document Uploader
 */
// Regular expression to match Google Docs document URLs
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

  useEffect(() => {
    try {
      const params = (sdk.parameters?.installation || {}) as Record<string, unknown>;
      const key = params && typeof params.apiKey === 'string' ? (params.apiKey as string) : null;
      setApiKey(key);
    } catch {
      setApiKey(null);
    }
  }, [sdk]);

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

  const fetchGoogleDoc = async (url: string) => {
    const docId = extractGoogleDocId(url);
    if (!docId) {
      throw new Error('Unable to extract Google Doc ID from URL.');
    }
    const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
    // Try to get metadata (name) first
    let title: string | null = null;
    try {
      const metaResp = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          docId
        )}?fields=name,mimeType&supportsAllDrives=true${keyParam}`,
        { method: 'GET' }
      );
      if (metaResp.ok) {
        const meta = (await metaResp.json()) as { name?: string; mimeType?: string };
        title = meta.name || null;
      }
    } catch {
      // ignore metadata failure, continue to export
    }
    // Export as HTML
    let html: string | null = null;
    // First attempt: Drive API with key (and Shared Drives support)
    const driveUrlWithKey = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      docId
    )}/export?mimeType=text/html&supportsAllDrives=true${keyParam}`;
    let exportResp = await fetch(driveUrlWithKey, { method: 'GET' });
    if (!exportResp.ok) {
      // Second attempt: Drive API without key (public file with anyone link)
      const driveUrlNoKey = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        docId
      )}/export?mimeType=text/html&supportsAllDrives=true`;
      exportResp = await fetch(driveUrlNoKey, { method: 'GET' });
    }
    if (exportResp.ok) {
      html = await exportResp.text();
    }
    if (!html) {
      throw new Error(
        'Unable to fetch the document. Ensure the Doc is shared as "Anyone with the link — Viewer", or provide an API key with access. Files in Shared Drives may also require this setting.'
      );
    }
    return { title: title || 'Google Document', html };
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

  const loadMammoth = async () => {
    if (window.mammoth) return window.mammoth;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load mammoth.js'));
      document.body.appendChild(script);
    });
    if (!window.mammoth) {
      throw new Error('mammoth.js failed to initialize');
    }
    return window.mammoth;
  };

  const convertDocxToHtml = async (file: File) => {
    const mammoth = await loadMammoth();
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
      <Box padding="spacingXl" style={{ maxWidth: '1120px', margin: '0 auto' }}>
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
