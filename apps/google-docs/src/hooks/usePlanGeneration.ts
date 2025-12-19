import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { createPlanFromDocumentAction } from '../utils/appFunctionUtils';
import { fetchGoogleDocAsJson } from '../utils/googleDriveUtils';
import { ERROR_MESSAGES } from '../constants/messages';
import { EntryToCreate } from '../../functions/agents/documentParserAgent/schema';

interface AssetInfo {
  url: string;
  altText: string;
  fileName: string;
}

interface PlanData {
  summary: string;
  totalEntries: number;
  entries: EntryToCreate[];
  assets?: AssetInfo[];
  totalAssets?: number;
}

interface UsePlanGenerationReturn {
  plan: PlanData | null;
  isLoading: boolean;
  error: string | null;
  generatePlan: (contentTypeIds: string[]) => Promise<void>;
  clearPlan: () => void;
}

export const usePlanGeneration = (
  sdk: PageAppSDK,
  documentId: string,
  oauthToken: string
): UsePlanGenerationReturn => {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const validatePlanGeneration = useCallback(
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

  const generatePlan = useCallback(
    async (contentTypeIds: string[]) => {
      const validationError = validatePlanGeneration(contentTypeIds);
      if (validationError) {
        setError(validationError);
        setPlan(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setPlan(null);

      try {
        // Fetch document JSON from frontend
        const documentJson = await fetchGoogleDocAsJson(documentId, oauthToken);

        const response = await createPlanFromDocumentAction(sdk, contentTypeIds, documentJson);
        console.log('Plan generation response:', response);

        if (response.sys?.status === 'succeeded' && response.sys?.result) {
          const result = response.sys.result as {
            success?: boolean;
            response?: {
              summary: string;
              totalEntries: number;
              entries: EntryToCreate[];
              assets?: AssetInfo[];
              totalAssets?: number;
            };
            summary?: string;
            totalEntries?: number;
            entries?: EntryToCreate[];
            assets?: AssetInfo[];
            totalAssets?: number;
          };

          // Handle both response structures: direct result or wrapped in response object
          const planData = result.response || result;

          // Type guard to ensure planData has the required properties
          if (
            planData &&
            typeof planData === 'object' &&
            'summary' in planData &&
            'totalEntries' in planData &&
            'entries' in planData &&
            typeof planData.summary === 'string' &&
            typeof planData.totalEntries === 'number' &&
            Array.isArray(planData.entries)
          ) {
            // Safely extract assets and totalAssets with proper type checking
            const assets =
              'assets' in planData && Array.isArray(planData.assets)
                ? (planData.assets as AssetInfo[])
                : undefined;
            const totalAssets =
              'totalAssets' in planData && typeof planData.totalAssets === 'number'
                ? planData.totalAssets
                : undefined;

            setPlan({
              summary: planData.summary,
              totalEntries: planData.totalEntries,
              entries: planData.entries,
              assets,
              totalAssets,
            });
          } else {
            setError('Invalid plan data structure received');
          }
        } else {
          setError('Failed to generate plan');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate plan');
      } finally {
        setIsLoading(false);
      }
    },
    [sdk, documentId, oauthToken, validatePlanGeneration]
  );

  const clearPlan = useCallback(() => {
    setPlan(null);
    setError(null);
  }, []);

  return {
    plan,
    isLoading,
    error,
    generatePlan,
    clearPlan,
  };
};
