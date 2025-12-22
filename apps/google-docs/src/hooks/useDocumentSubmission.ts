import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { analyzeContentTypesAction, createPreviewAction } from '../utils/appActionUtils';
import { ERROR_MESSAGES } from '../constants/messages';
import { PreviewData } from '../components/page/PreviewModal';

interface UseDocumentSubmissionReturn {
  isSubmitting: boolean;
  previewData: PreviewData | null;
  errorMessage: string | null;
  successMessage: string | null;
  submit: (contentTypeIds: string[]) => Promise<void>;
  clearMessages: () => void;
}

export const useDocumentSubmission = (
  sdk: PageAppSDK,
  documentId: string,
  oauthToken: string
): UseDocumentSubmissionReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateSubmission = useCallback(
    (contentTypeIds: string[]): string | null => {
      const openAiApiKey = sdk.parameters.installation?.openAiApiKey as string | undefined;

      if (!openAiApiKey || !openAiApiKey.trim()) {
        return ERROR_MESSAGES.NO_API_KEY;
      }

      if (!documentId || !documentId.trim()) {
        return ERROR_MESSAGES.NO_DOCUMENT;
      }

      if (contentTypeIds.length === 0) {
        return ERROR_MESSAGES.NO_CONTENT_TYPE;
      }

      return null;
    },
    [sdk, documentId]
  );

  const submit = useCallback(
    async (contentTypeIds: string[]) => {
      const validationError = validateSubmission(contentTypeIds);
      if (validationError) {
        setErrorMessage(validationError);
        setSuccessMessage(null);
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setPreviewData(null);

      try {
        const analyzeContentTypesResponse = await analyzeContentTypesAction(
          sdk,
          contentTypeIds,
          oauthToken
        );
        console.log('analyzeContentTypesResponse', analyzeContentTypesResponse);

        const processDocumentResponse = await createPreviewAction(
          sdk,
          contentTypeIds,
          documentId,
          oauthToken
        );
        console.log('processDocumentResponse', processDocumentResponse);

        setPreviewData((processDocumentResponse as any).sys.result);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : ERROR_MESSAGES.SUBMISSION_FAILED);
      } finally {
        setIsSubmitting(false);
      }
    },
    [sdk, documentId, oauthToken, validateSubmission]
  );

  const clearMessages = useCallback(() => {
    setPreviewData(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, []);

  return {
    isSubmitting,
    previewData,
    errorMessage,
    successMessage,
    submit,
    clearMessages,
  };
};
