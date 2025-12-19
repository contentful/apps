import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { analyzeDocumentWithAgent } from './agents/documentParserAgent/documentParser.agent';
import { fetchContentTypes } from './service/contentTypeService';
import { initContentfulManagementClient } from './service/initCMAClient';
import { createEntries } from './service/entryService';
import { EntryToCreate } from './agents/documentParserAgent/schema';

export type AppActionParameters = {
  contentTypeIds: string[];
  documentJson?: unknown; // Optional: Google Doc JSON (if entries not provided, will analyze document)
  entries?: EntryToCreate[]; // Optional: if provided, skip document analysis and use these entries
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
  const { contentTypeIds, documentJson, entries: providedEntries } = event.body;
  const { openAiApiKey } = context.appInstallationParameters as AppInstallationParameters;

  if (!contentTypeIds || contentTypeIds.length === 0) {
    throw new Error('At least one content type ID is required');
  }

  const cma = initContentfulManagementClient(context);
  const contentTypes = await fetchContentTypes(cma, new Set<string>(contentTypeIds));

  // If entries are provided (from plan), use them directly instead of re-analyzing
  let entriesToCreate: EntryToCreate[];
  let summary: string;
  let totalEntries: number;

  if (providedEntries && Array.isArray(providedEntries) && providedEntries.length > 0) {
    // Use provided entries from plan - skip document analysis
    entriesToCreate = providedEntries;
    summary = `Creating ${entriesToCreate.length} entries from plan`;
    totalEntries = entriesToCreate.length;
  } else if (documentJson) {
    // Fallback: analyze document if entries not provided but documentJson is available
    const aiDocumentResponse = await analyzeDocumentWithAgent({
      documentJson,
      openAiApiKey,
      contentTypes,
    });
    entriesToCreate = aiDocumentResponse.entries;
    summary = aiDocumentResponse.summary;
    totalEntries = aiDocumentResponse.totalEntries;
  } else {
    throw new Error('Either entries or documentJson must be provided');
  }

  // INTEG-3264: Create the entries in Contentful using the entry service
  const creationResult = await createEntries(cma, entriesToCreate, {
    spaceId: context.spaceId,
    environmentId: context.environmentId,
    contentTypes,
  });
  console.log('Created Entries Result:', creationResult);

  // INTEG-3265: Create the assets in Contentful using the asset service
  // await createAssets()

  return {
    success: true,
    response: {
      summary,
      totalEntriesExtracted: totalEntries,
      createdEntries: creationResult.createdEntries.map((entry) => ({
        id: entry.sys.id,
        contentType: entry.sys.contentType.sys.id,
      })),
      errors: creationResult.errors,
      successRate: `${creationResult.createdEntries.length}/${totalEntries}`,
    },
  };
};
