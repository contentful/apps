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
} from '../src/utils';
import { createClient, EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

const WAIT_TIMES = [0, 5000, 10000];

function initContentfulManagementClient(context: FunctionEventContext): PlainClientAPI {
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

export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const { brazeApiKey, brazeEndpoint } =
    context.appInstallationParameters as AppInstallationParameters;
  const cma = initContentfulManagementClient(context);

  if (event.headers['X-Contentful-Topic'].includes('AppInstallation.delete')) {
    await callAndRetry(() => deleteConfigEntry(cma));
    return;
  }

  const body = event.body as any;
  const entryId = body.sys.id;

  const configEntry: EntryProps<KeyValueMap> = await getConfigEntry(cma);
  const configField = configEntry.fields[CONFIG_FIELD_ID];
  if (!configField) {
    return;
  }
  const connectedFields = Object.values(configField)[0] as ConnectedFields;
  const entryConnectedFields = connectedFields[entryId];
  if (!entryConnectedFields) {
    return;
  }

  if (event.headers['X-Contentful-Topic'].includes('Entry.delete')) {
    delete connectedFields[entryId];
    await callAndRetry(() => updateConfig(configEntry, connectedFields, cma));
    return;
  }

  if (
    event.headers['X-Contentful-Topic'].includes('Entry.save') ||
    event.headers['X-Contentful-Topic'].includes('Entry.auto_save')
  ) {
    const contentType = await cma.contentType.get({
      contentTypeId: body.sys.contentType.sys.id,
    });

    for (const fieldId of Object.keys(body.fields)) {
      const field = entryConnectedFields.find(
        (connectedField) => connectedField.fieldId === fieldId
      );
      if (!field) {
        continue;
      }
      const contentBlockId = field.contentBlockId;
      let newValue: any = Object.values(body.fields[fieldId])[0];

      const fieldInfo = contentType.fields.find((f) => f.id === fieldId);

      if (fieldInfo?.type === 'RichText') {
        newValue = documentToHtmlString(newValue);
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
