import { useState, useCallback } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { createPreview } from '../utils/appFunctionUtils';
import { fetchGoogleDocAsJson } from '../utils/googleDriveUtils';
import { EntryToCreate } from '../../functions/agents/documentParserAgent/schema';

interface AssetInfo {
  url: string;
  altText: string;
  fileName: string;
}

interface PreviewData {
  summary: string;
  totalEntries: number;
  entries: EntryToCreate[];
  assets?: AssetInfo[];
  totalAssets?: number;
}

interface UsePreviewGenerationReturn {
  preview: PreviewData | null;
  isLoading: boolean;
  error: string | null;
  generatePreview: (contentTypeIds: string[]) => Promise<void>;
}

export const usePreviewGeneration = (
  sdk: PageAppSDK,
  documentId: string,
  oauthToken: string
): UsePreviewGenerationReturn => {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = useCallback(
    async (contentTypeIds: string[]) => {
      setIsLoading(true);
      setError(null);
      setPreview(null);

      try {
        const documentJson = await fetchGoogleDocAsJson(documentId, oauthToken);

        const response = await createPreview(sdk, contentTypeIds, documentJson);

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
          const previewData = result.response || result;

          // Type guard to ensure previewData has the required properties
          if (
            previewData &&
            typeof previewData === 'object' &&
            'summary' in previewData &&
            'totalEntries' in previewData &&
            'entries' in previewData &&
            typeof previewData.summary === 'string' &&
            typeof previewData.totalEntries === 'number' &&
            Array.isArray(previewData.entries)
          ) {
            // Safely extract assets and totalAssets with proper type checking
            const assets =
              'assets' in previewData && Array.isArray(previewData.assets)
                ? (previewData.assets as AssetInfo[])
                : undefined;
            const totalAssets =
              'totalAssets' in previewData && typeof previewData.totalAssets === 'number'
                ? previewData.totalAssets
                : undefined;

            setPreview({
              summary: previewData.summary,
              totalEntries: previewData.totalEntries,
              entries: previewData.entries,
              assets,
              totalAssets,
            });
          } else {
            setError('Invalid preview data structure received');
          }
        } else {
          setError('Failed to generate preview');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate plan');
      } finally {
        setIsLoading(false);
      }
    },
    [sdk, documentId, oauthToken]
  );

  return {
    preview,
    isLoading,
    error,
    generatePreview,
  };
};
