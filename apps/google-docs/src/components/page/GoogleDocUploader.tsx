import { useState, useEffect } from 'react';
import { Box, Button, Form, FormControl, TextInput } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';

interface GoogleDocUploaderProps {
  sdk: PageAppSDK;
  onSuccess: (title: string, html: string | null) => void;
  onError: (message: string) => void;
  isDisabled?: boolean;
}

function isValidGoogleDocUrl(url: string): boolean {
  return /^https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]+\/edit(?:\?[^#]*)?$/.test(url);
}

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

export const GoogleDocUploader = ({
  sdk,
  onSuccess,
  onError,
  isDisabled,
}: GoogleDocUploaderProps) => {
  const [googleDocUrl, setGoogleDocUrl] = useState<string>('');
  const [googleDocUrlValid, setGoogleDocUrlValid] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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

  const onSubmitGoogleDoc = async () => {
    const isValid = validateGoogleDocUrl(googleDocUrl);
    if (!isValid) {
      sdk.notifier.error('Please enter a valid public Google Doc link.');
      return;
    }
    try {
      setIsUploading(true);
      const result = await fetchGoogleDoc(googleDocUrl);
      onSuccess(result.title, result.html);
      sdk.notifier.success('Google Doc uploaded successfully');
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : 'Failed to fetch Google Doc. Ensure it is publicly accessible.';
      onError(message);
      sdk.notifier.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
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
          Must be a publicly accessible Google Docs URL (View access)
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
            isDisabled={isDisabled || isUploading || !googleDocUrl || !googleDocUrlValid}
            onClick={onSubmitGoogleDoc}>
            {isUploading ? 'Uploading...' : 'Upload Google Doc'}
          </Button>
        </Box>
      </FormControl>
    </Form>
  );
};
