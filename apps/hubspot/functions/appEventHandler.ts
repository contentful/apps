import {
  FunctionEventHandler,
  FunctionTypeEnum,
  FunctionEventContext,
  AppEventRequest,
} from '@contentful/node-apps-toolkit';
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

  if (contentfulTopic.includes('Entry.delete')) {
    await callAndRetry(() => configService.removeEntryConnectedFields(entryId));
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
