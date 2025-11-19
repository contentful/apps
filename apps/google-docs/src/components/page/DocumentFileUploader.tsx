import { useState, useRef } from 'react';
import { Box, Button, Form, FormControl, Paragraph } from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import mammoth from 'mammoth';

interface DocumentFileUploaderProps {
  sdk: PageAppSDK;
  onSuccess: (title: string, html: string | null, isDocxRendered: boolean) => void;
  onError: (message: string) => void;
  isDisabled?: boolean;
  previewRef?: React.RefObject<HTMLDivElement>;
}

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

export const DocumentFileUploader = ({
  sdk,
  onSuccess,
  onError,
  isDisabled,
  previewRef,
}: DocumentFileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const onSelectFile = (fileList: FileList | null) => {
    setFile(null);
    setFileError(null);
    if (!fileList || fileList.length === 0) {
      return;
    }
    const file = fileList[0];
    setFile(file);
  };

  const simulateUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);
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
    setIsUploading(false);
  };

  const onSubmitDoc = async () => {
    if (!file) {
      setFileError('Please choose a document file to upload.');
      return;
    }

    try {
      const lower = file.name.toLowerCase();
      const isDocx = lower.endsWith('.docx');

      if (isDocx && previewRef) {
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
            onSuccess(file.name, null, true);
            sdk.notifier.success(`Rendered "${file.name}" successfully.`);
            return;
          }
        } catch {
          // Fallback to mammoth if docx-preview fails
          const html = await convertDocxToHtml(file);
          await simulateUpload();
          onSuccess(file.name, html, false);
          sdk.notifier.success(`Uploaded "${file.name}" successfully.`);
          return;
        }
      }

      // Non-docx or unable to render with docx-preview; try mammoth fallback for best effort
      const html = await convertDocxToHtml(file);
      await simulateUpload();
      onSuccess(file.name, html, false);
      sdk.notifier.success(`Uploaded "${file.name}" successfully.`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to parse document file.';
      onError(message);
      sdk.notifier.error(message);
    }
  };

  return (
    <Form>
      <FormControl>
        <FormControl.Label>Document file (.doc, .docx)</FormControl.Label>
        <Box marginTop="spacingS">
          <input type="file" accept=".doc,.docx" onChange={(e) => onSelectFile(e.target.files)} />
        </Box>
        <FormControl.HelpText>Choose a document file from your computer</FormControl.HelpText>
        {fileError && <FormControl.ValidationMessage>{fileError}</FormControl.ValidationMessage>}
        <Box marginTop="spacingS">
          <Button isDisabled={isDisabled || isUploading || !file} onClick={onSubmitDoc}>
            {isUploading ? 'Uploading...' : 'Upload Document File'}
          </Button>
        </Box>

        {isUploading && (
          <Box marginTop="spacingS">
            <Paragraph>Uploading... {uploadProgress}%</Paragraph>
            <progress max={100} value={uploadProgress} style={{ width: '100%' }} />
          </Box>
        )}
      </FormControl>
    </Form>
  );
};
