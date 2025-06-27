import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import {
  createClient,
  EntryProps,
  KeyValueMap,
  PlainClientAPI,
  ContentFields,
} from 'contentful-management';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
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

export const stringifyFieldValue = (fieldValue: any, field: ContentFields<KeyValueMap>): string => {
  switch (field.type) {
    case 'Symbol':
    case 'Text':
    case 'Integer':
    case 'Number':
    case 'Boolean':
      return String(fieldValue);

    case 'Date':
      return new Date(fieldValue).toISOString();

    case 'Object':
      return JSON.stringify(fieldValue);

    case 'RichText':
      return documentToHtmlString(fieldValue);

    case 'Location':
      return `lat:${fieldValue.lat},long:${fieldValue.lon}`;

    default:
      throw new Error(`Field type '${field.type}' is not supported`);
  }
};
