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
  ConnectedField,
} from '../src/utils';
import { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import {
  getConfigAndConnectedFields,
  initContentfulManagementClient,
  stringifyFieldValue,
} from './common';
import { CustomError } from './customError';

const WAIT_TIMES = [1000, 2000];

export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const cma = initContentfulManagementClient(context);

  const contentfulTopic = event.headers['X-Contentful-Topic'];
  if (contentfulTopic.includes('AppInstallation.delete')) {
    return await appUninstalledHandler(cma);
  }

  const body = event.body as any;
  const entryId = body.sys.id;

  let configEntry: EntryProps<KeyValueMap>;
  let connectedFields: ConnectedFields;
  let entryConnectedFields: EntryConnectedFields;
  try {
    ({ configEntry, connectedFields, entryConnectedFields } = await getConfigAndConnectedFields(
      cma,
      entryId
    ));
  } catch (error) {
    return;
  }

  if (entryConnectedFields.length === 0) {
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

  const results: Array<ConnectedField> = [];
  for (const connectedField of entryConnectedFields) {
    const field = body.fields[connectedField.fieldId];
    const locale = connectedField.locale || Object.keys(field)[0];
    let fieldValue = field[locale];
    const fieldInfo = contentType.fields.find((f) => f.id === connectedField.fieldId);

    if (!fieldValue || !fieldInfo) {
      continue;
    }

    let updateResult: ConnectedField = {
      fieldId: connectedField.fieldId,
      locale,
      contentBlockId: connectedField.contentBlockId,
    };

    try {
      const stringifiedValue = stringifyFieldValue(fieldValue, fieldInfo);
      await callAndRetry(() =>
        updateContentBlock(
          brazeEndpoint,
          brazeApiKey,
          connectedField.contentBlockId,
          stringifiedValue
        )
      );
    } catch (error: any) {
      updateResult = {
        ...updateResult,
        error: {
          status: error?.statusCode || 500,
          message: error?.message || String(error),
        },
      };
    }

    results.push(updateResult);
  }

  if (results.length > 0) {
    await updateFieldErrors(cma, body.sys.id, results);
  }
};

async function callAndRetry(fn: () => Promise<any>): Promise<void> {
  let lastError: any;
  for (let i = 0; i <= WAIT_TIMES.length; i++) {
    try {
      await fn();
      return;
    } catch (error) {
      lastError = error;
      if (i < WAIT_TIMES.length) {
        await new Promise((resolve) => setTimeout(resolve, WAIT_TIMES[i]));
      }
    }
  }
  throw lastError;
}

async function deleteConfigEntry(cma: PlainClientAPI) {
  try {
    await cma.entry.unpublish({ entryId: CONFIG_ENTRY_ID });
  } catch (e) {}
  try {
    await cma.entry.delete({ entryId: CONFIG_ENTRY_ID });
  } catch (e) {}
  try {
    await cma.contentType.unpublish({ contentTypeId: CONFIG_CONTENT_TYPE_ID });
  } catch (e) {}
  try {
    await cma.contentType.delete({ contentTypeId: CONFIG_CONTENT_TYPE_ID });
  } catch (e) {}
}

async function updateContentBlock(
  brazeEndpoint: string,
  brazeApiKey: string,
  contentBlockId: string,
  newValue: any
) {
  const response = await fetch(`${brazeEndpoint}/content_blocks/update`, {
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

  if (!response.ok) {
    const body = await response.json();
    throw new CustomError(
      `Failed to update content block: ${body.message}` || 'Unknown error',
      response.status
    );
  }
}

export const updateFieldErrors = async (
  cma: PlainClientAPI,
  entryId: string,
  results: Array<ConnectedField>
) => {
  const configEntry = await getConfigEntry(cma);
  const configField = configEntry.fields[CONFIG_FIELD_ID];
  const connectedFields = (Object.values(configField)[0] || {}) as ConnectedFields;

  const newFields = results.map((result: any) => {
    return {
      fieldId: result.fieldId,
      locale: result.locale,
      contentBlockId: result.contentBlockId,
      ...(result.error ? { error: result.error } : {}),
    };
  });

  connectedFields[entryId] = [...newFields];

  await updateConfig(configEntry, connectedFields, cma);
};
