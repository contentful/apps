import {
  FunctionEventHandler,
  FunctionTypeEnum,
  FunctionEventContext,
  AppEventRequest,
} from '@contentful/node-apps-toolkit';
import { ConnectedFields, EntryConnectedFields } from '../src/utils/utils';
import ConfigEntryService from '../src/utils/ConfigEntryService';
import { initContentfulManagementClient } from './common';

const WAIT_TIMES = [1000, 2000];

export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const cma = initContentfulManagementClient(context);

  const contentfulTopic = event.headers['X-Contentful-Topic'];

  const body = event.body as any;
  const entryId = body.sys.id;

  const configService = new ConfigEntryService(cma);
  let connectedFields: ConnectedFields | undefined;
  let entryConnectedFields: EntryConnectedFields | undefined;

  await callAndRetry(async () => {
    connectedFields = await configService.getConnectedFields();
    entryConnectedFields = await configService.getEntryConnectedFields(entryId);
  });

  if (!entryConnectedFields || entryConnectedFields.length === 0) {
    return;
  }

  if (contentfulTopic.includes('Entry.delete')) {
    await entryDeletedHandler(configService, entryId, connectedFields!);
  }
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
