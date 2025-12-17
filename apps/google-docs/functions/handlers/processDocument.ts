import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { analyzeDocumentWithAgent } from '../agents/documentParserAgent/documentParser.agent';
import { fetchContentTypes } from '../service/contentTypeService';
import { initContentfulManagementClient } from '../service/initCMAClient';

import { parseDocument, validateDocument } from '../utils/documentValidationUtils';

export type ProcessDocumentParameters = {
  contentTypeIds: string[];
  documentId: string; // JSON document from Google Docs API or test data
  oauthToken: string;
};

interface AppInstallationParameters {
  openAiApiKey: string;
}

/**
 * App Action: Process Document
 *
 * Processes a Google Doc and creates Contentful entries based on the document structure
 * and the provided content types. This function focuses solely on document processing
 * and entry creation.
 *
 * Note: Content type analysis should be done separately using the analyzeContentTypes
 * function to avoid timeout issues.
 */
export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  ProcessDocumentParameters
> = async (
  event: AppActionRequest<'Custom', ProcessDocumentParameters>,
  context: FunctionEventContext
) => {
  const { contentTypeIds, documentId, oauthToken } = event.body;
  const { openAiApiKey } = context.appInstallationParameters as AppInstallationParameters;

  // Validate inputs
  validateDocument(documentId);

  if (!contentTypeIds || contentTypeIds.length === 0) {
    throw new Error('At least one content type ID is required');
  }

  const cma = initContentfulManagementClient(context);

  const contentTypes = await fetchContentTypes(cma, new Set<string>(contentTypeIds));

  // Process the document and create entries
  const aiDocumentResponse = await analyzeDocumentWithAgent({
    documentId,
    oauthToken,
    openAiApiKey,
    contentTypes,
  });

  console.log('Document processing completed:', {
    summary: aiDocumentResponse.summary,
    totalEntries: aiDocumentResponse.totalEntries,
  });

  return {
    success: true,
    summary: aiDocumentResponse.summary,
    totalEntriesExtracted: aiDocumentResponse.totalEntries,
  };
};
