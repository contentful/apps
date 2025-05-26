import {
  FunctionEventHandler,
  FunctionTypeEnum,
  FunctionEventContext,
  AppEventRequest,
} from '@contentful/node-apps-toolkit';
import {
  getConfigEntry,
  CONFIG_FIELD_ID,
  CONFIG_ENTRY_ID,
  CONFIG_CONTENT_TYPE_ID,
  updateConfig,
  ConnectedFields,
  AppInstallationParameters,
  EntryConnectedFields,
} from '../src/utils';
import { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { initContentfulManagementClient } from './common';

const WAIT_TIMES = [0, 5000, 10000];

export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const cma = initContentfulManagementClient(context);

  const contentfulTopic = event.headers['X-Contentful-Topic'];
  if (contentfulTopic.includes('AppInstallation.delete')) {
    await appUninstalledHandler(cma);
  }

  const body = event.body as any;
  const entryId = body.sys.id;

  const configEntry: EntryProps<KeyValueMap> = await getConfigEntry(cma);
  const configField = configEntry.fields[CONFIG_FIELD_ID];
  if (!configField) {
    console.error(`Configuration field ${CONFIG_FIELD_ID} not found`);
    return;
  }
  const connectedFields = Object.values(configField)[0] as ConnectedFields;
  const entryConnectedFields = connectedFields[entryId];
  if (!entryConnectedFields) {
    return;
  }

  if (contentfulTopic.includes('Entry.delete')) {
    await entryDeletedHandler(cma, entryId, configEntry, connectedFields);
  } else if (
    contentfulTopic.includes('Entry.save') ||
    contentfulTopic.includes('Entry.auto_save')
  ) {
    await entrySavedHandler(cma, context, body, entryConnectedFields);
  }
};

const appUninstalledHandler = async (cma: PlainClientAPI) => {
  await callAndRetry(() => deleteConfigEntry(cma));
};

const entryDeletedHandler = async (
  cma: PlainClientAPI,
  entryId: string,
  configEntry: EntryProps<KeyValueMap>,
  connectedFields: ConnectedFields
) => {
  delete connectedFields[entryId];
  await callAndRetry(() => updateConfig(configEntry, connectedFields, cma));
};

const entrySavedHandler = async (
  cma: PlainClientAPI,
  context: FunctionEventContext,
  body: any,
  entryConnectedFields: EntryConnectedFields
) => {
  const { brazeApiKey, brazeEndpoint } =
    context.appInstallationParameters as AppInstallationParameters;

  const contentType = await cma.contentType.get({
    contentTypeId: body.sys.contentType.sys.id,
  });

  for (const fieldId of Object.keys(body.fields)) {
    for (let [locale, newValue] of Object.entries(body.fields[fieldId])) {
      const field = entryConnectedFields.find(
        (connectedField) =>
          connectedField.fieldId === fieldId &&
          (connectedField.locale === locale || !connectedField.locale)
      );
      if (!field) {
        continue;
      }
      const contentBlockId = field.contentBlockId;

      const fieldInfo = contentType.fields.find((f) => f.id === fieldId);

      if (fieldInfo?.type === 'RichText') {
        newValue = documentToHtmlString(newValue as any);
      }

      await callAndRetry(() =>
        updateContentBlock(brazeEndpoint, brazeApiKey, contentBlockId, newValue)
      );
    }
  }
};

async function callAndRetry(fn: () => Promise<any>, waitTimeIndex: number = 0): Promise<void> {
  try {
    await fn();
  } catch (error) {
    if (waitTimeIndex < WAIT_TIMES.length) {
      await new Promise((resolve) => setTimeout(resolve, WAIT_TIMES[waitTimeIndex]));
      return callAndRetry(fn, waitTimeIndex + 1);
    }
    throw error;
  }
}

async function deleteConfigEntry(cma: PlainClientAPI) {
  await cma.entry.unpublish({ entryId: CONFIG_ENTRY_ID });
  await cma.entry.delete({ entryId: CONFIG_ENTRY_ID });
  await cma.contentType.unpublish({ contentTypeId: CONFIG_CONTENT_TYPE_ID });
  await cma.contentType.delete({ contentTypeId: CONFIG_CONTENT_TYPE_ID });
}

async function updateContentBlock(
  brazeEndpoint: string,
  brazeApiKey: string,
  contentBlockId: string,
  newValue: any
) {
  await fetch(`${brazeEndpoint}/content_blocks/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${brazeApiKey}`,
    },
    body: JSON.stringify({
      content_block_id: contentBlockId,
      content: newValue,
    }),
  });
}
