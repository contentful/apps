import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { createContentTypesAnalysisAction, createPreviewAction } from '../utils/appAction';
import { ERROR_MESSAGES } from '../utils/constants/messages';
import { PreviewResponseType } from '../locations/Page/components/modals/step_3/PreviewModal';
import { getEntryTitle } from '../utils/getEntryTitle';
import { EntryToCreate } from '../../functions/agents/documentParserAgent/schema';
interface UseGeneratePreviewResult {
  isSubmitting: boolean;
  previewData: PreviewResponseType;
  errorMessage: string | null;
  successMessage: string | null;
  submit: (contentTypeIds: string[]) => Promise<void>;
  clearMessages: () => void;
}

interface UseGeneratePreviewProps {
  sdk: PageAppSDK;
  documentId: string;
  oauthToken: string;
}

export const useGeneratePreview = ({
  sdk,
  documentId,
  oauthToken,
}: UseGeneratePreviewProps): UseGeneratePreviewResult => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<PreviewResponseType>({
    entries: [],
    entryTitles: [],
  });
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

      try {
        const analyzeContentTypesResponse = await createContentTypesAnalysisAction(
          sdk,
          contentTypeIds,
          oauthToken
        );
        console.log('analyzeContentTypesResponse', analyzeContentTypesResponse);

        const previewResponse = await createPreviewAction(
          sdk,
          contentTypeIds,
          documentId,
          oauthToken
        );
        console.log('previewResponse', previewResponse);

        const previewData = (previewResponse as any).sys.result;

        console.log('previewData', previewData);

        // for v0, we are only displaying the titles and content type names in the preview modal
        const entryTitles = await Promise.all(
          previewData.entries.map((entry: EntryToCreate) => getEntryTitle({ sdk, entry }))
        );

        setPreviewData({
          ...previewData,
          entryTitles,
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : ERROR_MESSAGES.SUBMISSION_FAILED);
      } finally {
        setIsSubmitting(false);
      }
    },
    [sdk, documentId, oauthToken, validateSubmission]
  );

  const clearMessages = useCallback(() => {
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
