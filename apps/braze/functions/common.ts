import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { createClient, EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import {
  ConnectedFields,
  EntryConnectedFields,
  getConfigEntry,
  CONFIG_FIELD_ID,
} from '../src/utils';

export function initContentfulManagementClient(context: FunctionEventContext): PlainClientAPI {
  if (!context.cmaClientOptions) {
    throw new Error(
      'Contentful Management API client options are only provided for certain function types. To learn more about using the CMA within functions, see https://www.contentful.com/developers/docs/extensibility/app-framework/functions/#using-the-cma.'
    );
  }
  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
    },
  });
}

export async function getConfigAndConnectedFields(
  cma: PlainClientAPI,
  entryId: string
): Promise<{
  configEntry: EntryProps<KeyValueMap>;
  connectedFields: ConnectedFields;
  entryConnectedFields: EntryConnectedFields;
}> {
  const configEntry: EntryProps<KeyValueMap> = await getConfigEntry(cma);
  const configField = configEntry.fields[CONFIG_FIELD_ID];
  if (!configField) {
    console.error(`Configuration field ${CONFIG_FIELD_ID} not found`);
    throw new Error(`Configuration field ${CONFIG_FIELD_ID} not found`);
  }
  const connectedFields = Object.values(configField)[0] as ConnectedFields;
  const entryConnectedFields = connectedFields[entryId] || [];
  return { configEntry, connectedFields, entryConnectedFields };
}
