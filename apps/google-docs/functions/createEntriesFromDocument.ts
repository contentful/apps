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
  googleDocUrl: string;
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
  const { contentTypeIds, googleDocUrl } = event.body;
  const { openAiApiKey } = context.appInstallationParameters as AppInstallationParameters;
  const cma = initContentfulManagementClient(context);
  const contentTypes = await fetchContentTypes(cma, new Set<string>(contentTypeIds));

  // Commented out to preserver as much time as possible due to the 30 second limit for App functions
  // const contentTypeParserAgentResult = await analyzeContentTypes({ contentTypes, openAiApiKey });

  // INTEG-3261: Pass the ai content type response to the observer for analysis
  // createContentTypeObservationsFromLLMResponse()

  const aiDocumentResponse = await createDocument({
    googleDocUrl,
    openAiApiKey,
    contentTypes,
  });

  // INTEG-3261: Pass the ai document response to the observer for analysis
  // createDocumentObservationsFromLLMResponse()

  // INTEG-3264: Create the entries in Contentful using the entry service
  // The aiDocumentResponse.entries is now ready to be passed to the CMA client
  const creationResult = await createEntries(cma, aiDocumentResponse.entries, {
    spaceId: context.spaceId,
    environmentId: context.environmentId,
  });

  // INTEG-3265: Create the assets in Contentful using the asset service
  // await createAssets()

  return {
    success: true,
    response: {
      // contentTypeParserAgentResult,
      summary: aiDocumentResponse.summary,
      totalEntriesExtracted: aiDocumentResponse.totalEntries,
      createdEntries: creationResult.createdEntries.map((entry) => ({
        id: entry.sys.id,
        contentType: entry.sys.contentType.sys.id,
      })),
      errors: creationResult.errors,
      successRate: `${creationResult.createdEntries.length}/${aiDocumentResponse.totalEntries}`,
    },
  };
};
