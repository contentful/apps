import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { createContentTypesAnalysisAction, createPreviewAction } from '../utils/appAction';
import { ERROR_MESSAGES } from '../utils/constants/messages';
import { PreviewEntry } from '../locations/Page/components/modals/step_3/PreviewModal';
import { getEntryTitle } from '../utils/getEntryTitle';
import { EntryToCreate, AssetToCreate } from '../../functions/agents/documentParserAgent/schema';

interface UseGeneratePreviewResult {
  isSubmitting: boolean;
  previewEntries: PreviewEntry[];
  assets: AssetToCreate[];
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
  const [previewEntries, setPreviewEntries] = useState<PreviewEntry[]>([]);
  const [assets, setAssets] = useState<AssetToCreate[]>([]);
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

        const { entries, assets: agentAssets = [] } = await createPreviewAction(
          sdk,
          contentTypeIds,
          documentId,
          oauthToken
        );

        // Build preview entries with title info
        const previewEntriesWithTitles: PreviewEntry[] = await Promise.all(
          entries.map(async (entry: EntryToCreate) => {
            const { title, contentTypeName } = await getEntryTitle({ sdk, entry });
            return { entry, title, contentTypeName };
          })
        );

        setPreviewEntries(previewEntriesWithTitles);
        setAssets(agentAssets);
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
    previewEntries,
    assets,
    errorMessage,
    successMessage,
    submit,
    clearMessages,
  };
};
