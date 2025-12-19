import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { createPreviewWithAgent } from '../../agents/documentParserAgent/documentParser.agent';
import { fetchContentTypes } from '../../service/contentTypeService';
import { initContentfulManagementClient } from '../../service/initCMAClient';

export type AppActionParameters = {
  contentTypeIds: string[];
  documentJson: unknown; // Google Doc JSON (fetched from frontend)
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
  AppActionParameters
> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  const { contentTypeIds, documentJson } = event.body;
  const { openAiApiKey } = context.appInstallationParameters as AppInstallationParameters;
  if (!documentJson) {
    throw new Error('Document JSON is required');
  }

  if (!contentTypeIds || contentTypeIds.length === 0) {
    throw new Error('At least one content type ID is required');
  }

  const cma = initContentfulManagementClient(context);
  const contentTypes = await fetchContentTypes(cma, new Set<string>(contentTypeIds));

  // Use the same AI agent to analyze the document and generate proposed entries
  const aiDocumentResponse = await createPreviewWithAgent({
    documentJson,
    openAiApiKey,
    contentTypes,
  });

  return {
    success: true,
    response: {
      entries: aiDocumentResponse.entries,
      summary: aiDocumentResponse.summary,
      totalEntries: aiDocumentResponse.totalEntries,
    },
  };
};
