import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { createEntriesFromDocumentAction } from '../utils/appFunctionUtils';
import { fetchGoogleDocAsJson } from '../utils/googleDriveUtils';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/messages';
import { EntryToCreate } from '../../functions/agents/documentParserAgent/schema';

interface UseDocumentSubmissionReturn {
  isSubmitting: boolean;
  previewEntries: EntryToCreate[];
  errorMessage: string | null;
  successMessage: string | null;
  submit: (contentTypeIds: string[], entries?: any[]) => Promise<void>;
  clearMessages: () => void;
}

interface FinalEntriesResult {
  entries: EntryToCreate[];
  summary: string;
  totalEntries: number;
}

export const useDocumentSubmission = (
  sdk: PageAppSDK,
  documentId: string,
  oauthToken: string
): UseDocumentSubmissionReturn => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewEntries, setPreviewEntries] = useState<EntryToCreate[]>([]);
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
    async (contentTypeIds: string[], entries?: any[]) => {
      const validationError = validateSubmission(contentTypeIds);
      if (validationError) {
        setErrorMessage(validationError);
        setSuccessMessage(null);
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setPreviewEntries([]);

      try {
        // If entries provided, use them directly. Otherwise fetch document JSON as fallback
        let documentJson: unknown | undefined;
        if (!entries || entries.length === 0) {
          documentJson = await fetchGoogleDocAsJson(documentId, oauthToken);
        }

        const response = await createEntriesFromDocumentAction(
          sdk,
          contentTypeIds,
          entries,
          documentJson
        ) as any;
        const result: FinalEntriesResult = response.sys.result;

        setPreviewEntries(result.entries);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : ERROR_MESSAGES.SUBMISSION_FAILED);
      } finally {
        setIsSubmitting(false);
      }
    },
    [sdk, documentId, oauthToken, validateSubmission]
  );

  const clearMessages = useCallback(() => {
    setPreviewEntries([]);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, []);

  return {
    isSubmitting,
    previewEntries,
    errorMessage,
    successMessage,
    submit,
    clearMessages,
  };
};
