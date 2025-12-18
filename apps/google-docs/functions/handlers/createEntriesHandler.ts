import { AppActionRequest, FunctionEventHandler } from '@contentful/node-apps-toolkit';
import { createEntries } from '../service/entryService';
import { initContentfulManagementClient } from '../service/initCMAClient';
import { EntryToCreate } from '../agents/documentParserAgent/schema';
import { FunctionTypeEnum, FunctionEventContext } from '@contentful/node-apps-toolkit';
import { ProcessDocumentParameters } from './processDocument';

interface CreateEntriesParameters {
  entries: EntryToCreate[];
  contentTypeIds: string[];
}

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  CreateEntriesParameters
> = async (
  event: AppActionRequest<'Custom', CreateEntriesParameters>,
  context: FunctionEventContext
) => {
  const { entries, contentTypeIds } = event.body;

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    throw new Error('entries parameter is required and must be a non-empty array');
  }

  if (!contentTypeIds || !Array.isArray(contentTypeIds) || contentTypeIds.length === 0) {
    throw new Error('contentTypeIds parameter is required and must be a non-empty array');
  }

  const cma = initContentfulManagementClient(context);

  // Fetch content types
  const contentTypesResponse = await cma.contentType.getMany({});
  const contentTypes = contentTypesResponse.items.filter((ct) =>
    contentTypeIds.includes(ct.sys.id)
  );

  if (contentTypes.length === 0) {
    throw new Error('No matching content types found');
  }

  // Create entries
  const result = await createEntries(cma, entries, {
    spaceId: context.spaceId,
    environmentId: context.environmentId,
    contentTypes: contentTypes,
  });

  return {
    success: true,
    result: result,
  };
};
