import {
  FunctionEventHandler,
  FunctionTypeEnum,
  FunctionEventContext,
  AppEventRequest,
} from '@contentful/node-apps-toolkit';
import ConfigEntryService from '../src/utils/ConfigEntryService';
import { createModuleFile, getFiles, initContentfulManagementClient } from './common';
import {
  AppInstallationParameters,
  CONFIG_CONTENT_TYPE_ID,
  CONFIG_ENTRY_ID,
  ConnectedField,
} from '../src/utils/utils';
import { PlainClientAPI } from 'contentful-management';

const WAIT_TIMES = [1000, 2000];

export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const cma = initContentfulManagementClient(context);

  const contentfulTopic = event.headers['X-Contentful-Topic'];

  if (contentfulTopic.includes('AppInstallation.delete')) {
    return await callAndRetry(() => deleteConfigEntry(cma));
  }

  const body = event.body as any;
  const entryId = body.sys.id;

  const configService = new ConfigEntryService(cma);

  const entryConnectedFields = await configService.getEntryConnectedFields(entryId);
  if (!entryConnectedFields || entryConnectedFields.length === 0) {
    // Entry is not tracked in config, skip the function
    return;
  }

  if (contentfulTopic.includes('Entry.delete')) {
    await callAndRetry(() => configService.removeEntryConnectedFields(entryId));
  } else if (
    contentfulTopic.includes('Entry.save') ||
    contentfulTopic.includes('Entry.auto_save')
  ) {
    const { hubspotAccessToken } = context.appInstallationParameters as AppInstallationParameters;
    await callAndRetry(() => entrySavedHandler(cma, hubspotAccessToken, body, configService));
  }
};

const entrySavedHandler = async (
  cma: PlainClientAPI,
  hubspotAccessToken: string,
  body: any,
  configService: ConfigEntryService
) => {
  const entryConnectedFields = await configService.getEntryConnectedFields(body.sys.id);

  const contentType = await cma.contentType.get({
    contentTypeId: body.sys.contentType.sys.id,
  });

  const results: Array<ConnectedField> = [];
  for (const connectedField of entryConnectedFields) {
    const field = body.fields[connectedField.fieldId];
    const locale = connectedField.locale || Object.keys(field)[0];
    let fieldValue = field[locale];
    const fieldInfo = contentType.fields.find(
      (f: { id: string }) => f.id === connectedField.fieldId
    );

    if (!fieldValue || !fieldInfo) {
      continue;
    }

    let updateResult: ConnectedField = {
      fieldId: connectedField.fieldId,
      locale,
      moduleName: connectedField.moduleName,
      updatedAt: new Date().toISOString(),
    };

    try {
      const { fieldsFile } = getFiles(fieldInfo.type, fieldValue);
      await createModuleFile(
        fieldsFile,
        'fields.json',
        connectedField.moduleName,
        hubspotAccessToken
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
    await configService.updateEntryConnectedFields(body.sys.id, results);
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
