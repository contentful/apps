import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  analyzeContentTypesAction,
  createEntriesFromDocumentAction,
  processDocumentAction,
} from '../utils/appActionUtils';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/messages';

interface UseDocumentSubmissionReturn {
  isSubmitting: boolean;
  result: any;
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
  const [result, setResult] = useState<any>(null);
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
      setResult(null);

      try {
        const response = await analyzeContentTypesAction(sdk, contentTypeIds);
        console.log('response', response);
        const processDocumentResponse = await processDocumentAction(
          sdk,
          contentTypeIds,
          documentId,
          oauthToken
        );
        console.log('processDocumentResponse', processDocumentResponse);

        setResult([response, processDocumentResponse]);
        setSuccessMessage(SUCCESS_MESSAGES.ENTRIES_CREATED);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : ERROR_MESSAGES.SUBMISSION_FAILED);
      } finally {
        setIsSubmitting(false);
      }
    },
    [sdk, documentId, oauthToken, validateSubmission]
  );

  const clearMessages = useCallback(() => {
    setResult(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, []);

  return {
    isSubmitting,
    result,
    errorMessage,
    successMessage,
    submit,
    clearMessages,
  };
};
