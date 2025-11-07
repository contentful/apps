import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
// INTEG-3262 and INTEG-3263: Likely imports to be used are commented out for now
// import { ContentTypeProps, EntryProps, ContentFields } from 'contentful-management';
// import { KeyValueMap } from 'contentful-management';
import { parseContentType } from './agents/contentTypeParser.agent';
import { createDocument } from './agents/documentParser.agent';
// import { createEntries, createAssets } from './service/entryService';

export type AppActionParameters = {
  contentType: string;
  prompt: string;
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
  const { contentType, prompt } = event.body;
  const { openAiApiKey } = context.appInstallationParameters as AppInstallationParameters;

  // INTEG-3262 and INTEG-3263: Take in Content Type, Prompt, and Upload File from user

  // INTEG-3262: Implement the content type parser agent
  const aiContentTypeResponse = parseContentType({
    openaiApiKey: openAiApiKey,
    modelVersion: 'gpt-4o',
    jsonData: contentType,
  });

  // INTEG-3261: Pass the ai content type response to the observer for analysis
  // createContentTypeObservationsFromLLMResponse()

  // INTEG-3263: Implement the document parser agent
  const aiDocumentResponse = createDocument({
    openaiApiKey: openAiApiKey,
    modelVersion: 'gpt-4o',
    jsonData: aiContentTypeResponse,
    document: document,
  });

  // INTEG-3261: Pass the ai document response to the observer for analysis
  // createDocumentObservationsFromLLMResponse()

  // INTEG-3264: Create the entries in Contentful using the entry service
  // await createEntries();

  // INTEG-3265: Create the assets in Contentful using the asset service
  // await createAssets()

  return { success: true, response: {} };
};
