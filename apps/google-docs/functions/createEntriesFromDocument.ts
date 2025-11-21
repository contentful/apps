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
  // INTEG-3262 and INTEG-3263: Take in Content Type, Prompt, and Upload File from user
  const cma = initContentfulManagementClient(context);
  const contentTypes = await fetchContentTypes(cma, new Set<string>(contentTypeIds));

  const contentTypeParserAgentResult = await analyzeContentTypes({ contentTypes, openAiApiKey });
  // console.log('contentTypeParserAgentResult', contentTypeParserAgentResult);

  // INTEG-3261: Pass the ai content type response to the observer for analysis
  // createContentTypeObservationsFromLLMResponse()

  // INTEG-3263: Implement the document parser agent
  // Pass the content types to the document parser so it can extract entries based on the structure
  const aiDocumentResponse = await createDocument({
    googleDocUrl,
    openAiApiKey,
    contentTypes,
  });

  // INTEG-3261: Pass the ai document response to the observer for analysis
  // createDocumentObservationsFromLLMResponse()

  // INTEG-3264: Create the entries in Contentful using the entry service
  // The aiDocumentResponse.entries is now ready to be passed to the CMA client
  // await createEntries(aiDocumentResponse.entries, { spaceId, environmentId, accessToken });

  // INTEG-3265: Create the assets in Contentful using the asset service
  // await createAssets()

  return {
    success: true,
    response: {
      contentTypeParserAgentResult,
      entriesReadyForCreation: aiDocumentResponse.entries,
    },
  };
};
