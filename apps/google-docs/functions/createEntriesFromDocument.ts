import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { analyzeContentTypes } from './agents/contentTypeParserAgent/contentTypeParser.agent';
import { createDocument } from './agents/documentParserAgent/documentParser.agent';
import { fetchContentTypes } from './service/contentTypeService';
import { initContentfulManagementClient } from './service/initCMAClient';
import { fetchGoogleDoc } from './service/googleDriveService';
import { createEntries } from './service/entryService';

export type AppActionParameters = {
  contentTypeIds: string[];
  document: unknown; // JSON document from Google Docs API or test data
};

interface AppInstallationParameters {
  openAiApiKey: string;
}

/*
 * Important Caveat: App Functions have a 30 second limit on execution time.
 * There is a likely future where we will need to break down the function into smaller functions.
 */
export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  AppActionParameters
> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  const { contentTypeIds, document } = event.body;
  const { openAiApiKey } = context.appInstallationParameters as AppInstallationParameters;

  if (!document) {
    throw new Error('Document is required');
  }

  if (!contentTypeIds || contentTypeIds.length === 0) {
    throw new Error('At least one content type ID is required');
  }

  // Parse document if it's a string (may be JSON stringified during transmission)
  let parsedDocument: unknown = document;
  if (typeof document === 'string') {
    // Check if it's a URL (starts with http:// or https://)
    if (document.startsWith('http://') || document.startsWith('https://')) {
      throw new Error(
        'Document URL provided but fetching from Google Docs API is not yet implemented. Please provide the document JSON object directly.'
      );
    }

    // Try to parse as JSON
    try {
      parsedDocument = JSON.parse(document);
    } catch (e) {
      // Provide more helpful error message
      const preview = document.substring(0, 100);
      throw new Error(
        `Failed to parse document as JSON. Document appears to be a string but is not valid JSON. ` +
          `Preview: ${preview}${document.length > 100 ? '...' : ''}. ` +
          `Error: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  const cma = initContentfulManagementClient(context);
  const contentTypes = await fetchContentTypes(cma, new Set<string>(contentTypeIds));

  // Commented out to preserver as much time as possible due to the 30 second limit for App functions
  const contentTypeParserAgentResult = await analyzeContentTypes({ contentTypes, openAiApiKey });

  // INTEG-3261: Pass the ai content type response to the observer for analysis
  // createContentTypeObservationsFromLLMResponse()

  const aiDocumentResponse = await createDocument({
    document: parsedDocument,
    openAiApiKey,
    contentTypes,
  });

  console.log('AI Document Response:', aiDocumentResponse);

  return {
    success: true,
    response: {
      contentTypeParserAgentResult,
      summary: aiDocumentResponse.summary,
      totalEntriesExtracted: aiDocumentResponse.totalEntries,
    },
  };
};
