import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { createPreviewWithAgent } from '../../agents/documentParserAgent/documentParser.agent';
import { fetchContentTypes } from '../../service/contentTypeService';
import { initContentfulManagementClient } from '../../service/initCMAClient';
import { EntryToCreate } from '../../agents/documentParserAgent/schema';

export type AppActionParameters = {
  contentTypeIds: string[];
  documentJson: unknown; // Google Doc JSON (fetched from frontend)
};

interface AppInstallationParameters {
  openAiApiKey: string;
}

interface AssetInfo {
  url: string;
  altText: string;
  fileName: string;
}

/**
 * Extracts asset information from entries by scanning RichText fields for image tokens
 */
function extractAssetsFromEntries(
  entries: EntryToCreate[],
  contentTypes: ContentTypeProps[]
): AssetInfo[] {
  const IMAGE_TOKEN_REGEX = /!\[([^\]]*?)\]\(([\s\S]*?)\)/g;
  const assetsMap = new Map<string, AssetInfo>();

  for (const entry of entries) {
    const contentType = contentTypes.find((ct) => ct.sys.id === entry.contentTypeId);
    if (!contentType) continue;

    // Check all RichText fields
    for (const field of contentType.fields) {
      if (field.type !== 'RichText') continue;

      const localizedValue = entry.fields[field.id];
      if (!localizedValue || typeof localizedValue !== 'object') continue;

      // Check all locales
      for (const value of Object.values(localizedValue)) {
        if (typeof value !== 'string') continue;

        // Reset regex state
        IMAGE_TOKEN_REGEX.lastIndex = 0;
        for (const match of value.matchAll(IMAGE_TOKEN_REGEX)) {
          const altText = (match[1] || '').trim();
          const url = String(match[2]).replace(/\s+/g, '').trim();

          if (!url) continue;

          // Extract filename from URL
          let fileName = 'image';
          try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();
            const pathParts = pathname.split('/').filter(Boolean);
            fileName = pathParts[pathParts.length - 1] || 'image';
            // Remove query params if present
            fileName = fileName.split('?')[0];
          } catch {
            // If URL parsing fails, use default
          }

          // Use URL as key to avoid duplicates
          if (!assetsMap.has(url)) {
            assetsMap.set(url, {
              url,
              altText: altText || fileName,
              fileName: fileName || 'image',
            });
          }
        }
      }
    }
  }

  return Array.from(assetsMap.values());
}

/**
 * Create Preview
 *
 * Processes a Google Doc and creates preview entries based on the document structure
 * and the provided content types.
 *
 */
export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  AppActionParameters
> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  const { contentTypeIds, documentJson } = event.body;
  console.log('Content types:', contentTypeIds);
  const { openAiApiKey } = context.appInstallationParameters as AppInstallationParameters;
  console.log('Open AI API Key:', openAiApiKey);
  if (!documentJson) {
    throw new Error('Document JSON is required');
  }

  if (!contentTypeIds || contentTypeIds.length === 0) {
    throw new Error('At least one content type ID is required');
  }

  const cma = initContentfulManagementClient(context);
  const contentTypes = await fetchContentTypes(cma, new Set<string>(contentTypeIds));
  console.log('Content types:', contentTypes);

  // Use the same AI agent to analyze the document and generate proposed entries
  const aiDocumentResponse = await createPreviewWithAgent({
    documentJson,
    openAiApiKey,
    contentTypes,
  });
  console.log('AI document response:', aiDocumentResponse);
  // Extract asset information from entries
  const assets = extractAssetsFromEntries(aiDocumentResponse.entries, contentTypes);

  console.log('Assets:', assets);
  // Return plan data without creating entries
  return {
    success: true,
    response: {
      ...aiDocumentResponse,
      assets,
      totalAssets: assets.length,
    },
  };
};
