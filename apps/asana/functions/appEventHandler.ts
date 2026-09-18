import type {
  AppEventRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { ASANA_AUTOMATION_CONFIG } from '../src/const';
import type { AppInstallationParameters } from '../src/types';
import { createTaskFromParameters } from './createTaskFromParameters';

type LocalizedFieldValue = Record<string, string | undefined> | undefined;

function getTopic(event: AppEventRequest) {
  return (
    event.headers['X-Contentful-Topic'] ??
    event.headers['x-contentful-topic'] ??
    event.headers['X-CONTENTFUL-TOPIC']
  );
}

function getFirstLocalizedValue(field: LocalizedFieldValue) {
  if (!field) {
    return '';
  }

  return Object.values(field).find((value) => typeof value === 'string' && value.trim()) ?? '';
}

async function getEntry(cma: PlainClientAPI, entryId: string) {
  return cma.entry.get({ entryId }) as Promise<EntryProps<KeyValueMap>>;
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const topic = getTopic(event);
  if (!topic?.includes('Entry.publish')) {
    return;
  }

  const body = event.body as EntryProps<KeyValueMap>;
  const entryId = body?.sys?.id;
  const contentTypeId = body?.sys?.contentType?.sys?.id;

  if (!entryId || contentTypeId !== ASANA_AUTOMATION_CONFIG.contentTypeId) {
    return;
  }

  const cma = context.cma;
  if (!cma) {
    throw new Error('Contentful CMA client is not available in the app event context.');
  }

  const entry = await getEntry(cma, entryId);
  const status = getFirstLocalizedValue(
    entry.fields[ASANA_AUTOMATION_CONFIG.statusFieldId] as LocalizedFieldValue
  );

  if (status !== ASANA_AUTOMATION_CONFIG.readyStatusValue) {
    return;
  }

  const installationParameters = (context.appInstallationParameters ??
    {}) as AppInstallationParameters;

  const result = await createTaskFromParameters({
    personalAccessToken: installationParameters.personalAccessToken,
    title: getFirstLocalizedValue(
      entry.fields[ASANA_AUTOMATION_CONFIG.taskNameFieldId] as LocalizedFieldValue
    ),
    notes: getFirstLocalizedValue(
      entry.fields[ASANA_AUTOMATION_CONFIG.taskNotesFieldId] as LocalizedFieldValue
    ),
    installationParameters,
  });

  if (!result.success) {
    throw new Error(result.message);
  }
};
