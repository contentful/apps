import {
  FunctionEventHandler,
  FunctionTypeEnum,
  FunctionEventContext,
  AppEventRequest,
} from '@contentful/node-apps-toolkit';
import {
  CONFIG_ENTRY_ID,
  CONFIG_CONTENT_TYPE_ID,
  ConnectedFields,
  EntryConnectedFields,
  initContentfulManagementClient,
} from '../src/utils/utils';
import { PlainClientAPI } from 'contentful-management';
import ConfigEntryService from '../src/utils/ConfigEntryService';

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

  const configService = new ConfigEntryService(cma);
  let connectedFields: ConnectedFields;
  let entryConnectedFields: EntryConnectedFields;
  try {
    connectedFields = await configService.getConnectedFields();
    entryConnectedFields = await configService.getEntryConnectedFields(entryId);
  } catch (error) {
    return;
  }

  if (entryConnectedFields.length === 0) {
    return;
  }

  if (contentfulTopic.includes('Entry.delete')) {
    await entryDeletedHandler(configService, entryId, connectedFields);
  }
};

const appUninstalledHandler = async (cma: PlainClientAPI) => {
  await callAndRetry(() => deleteConfigEntry(cma));
};

const entryDeletedHandler = async (
  configService: ConfigEntryService,
  entryId: string,
  connectedFields: ConnectedFields
) => {
  delete connectedFields[entryId];
  await callAndRetry(() => configService.updateConfig(connectedFields));
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
