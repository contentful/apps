import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { analyzeDocumentWithAgent } from '../agents/documentParserAgent/documentParser.agent';
import { fetchContentTypes } from '../service/contentTypeService';
import { initContentfulManagementClient } from '../service/initCMAClient';

export type CreatePreviewParameters = {
  contentTypeIds: string[];
  documentId: string;
  oauthToken: string;
};

interface AppInstallationParameters {
  openAiApiKey: string;
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
  CreatePreviewParameters
> = async (
  event: AppActionRequest<'Custom', CreatePreviewParameters>,
  context: FunctionEventContext
) => {
  const { contentTypeIds, documentId, oauthToken } = event.body;
  const { openAiApiKey } = context.appInstallationParameters as AppInstallationParameters;

  if (!contentTypeIds || contentTypeIds.length === 0) {
    throw new Error('At least one content type ID is required');
  }

  const cma = initContentfulManagementClient(context);

  const contentTypes = await fetchContentTypes(cma, new Set<string>(contentTypeIds));

  // Process the document and create preview entries
  const aiDocumentResponse = await analyzeDocumentWithAgent({
    documentId,
    oauthToken,
    openAiApiKey,
    contentTypes,
  });

  return {
    success: true,
    summary: aiDocumentResponse.summary,
    totalEntriesExtracted: aiDocumentResponse.totalEntries,
    entries: aiDocumentResponse.entries,
  };
};
