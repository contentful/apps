import type {
  AppEventRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import {
  ASANA_AUTOMATION_CONFIG,
  AUTOSAVE_COMMENT_CONFIG,
  TASK_LINK_CONTENT_TYPE_ID,
  VALIDATION_MESSAGES,
} from '../src/const';
import type { AppInstallationParameters } from '../src/types';
import { getTaskLinkForEntry, recordAutosaveComment } from '../src/utils/taskLinkStore';
import { addCommentToTask, getAsanaAccessToken } from './asanaClient';
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

// Posts a comment in Asana when a linked entry is autosaved, throttled to one comment per entry
// per AUTOSAVE_COMMENT_CONFIG.cooldownMs. This only reacts to events that already happened - there's
// no scheduled check to catch "editing went quiet," so the first autosave in a session posts the
// comment immediately and subsequent autosaves within the cooldown window are silently skipped.
async function handleAutoSave(
  body: EntryProps<KeyValueMap>,
  event: AppEventRequest,
  context: FunctionEventContext
) {
  const entryId = body?.sys?.id;
  const contentTypeId = body?.sys?.contentType?.sys?.id;

  // Skip the app's own internal task-link bookkeeping entries, which otherwise autosave whenever
  // a task gets linked/updated and would never have a task link of their own to comment on.
  if (!entryId || contentTypeId === TASK_LINK_CONTENT_TYPE_ID) {
    return;
  }

  const cma = context.cma;
  if (!cma) {
    throw new Error('Contentful CMA client is not available in the app event context.');
  }

  const taskLink = await getTaskLinkForEntry(cma, entryId);
  if (!taskLink) {
    return;
  }

  if (taskLink.lastAutosaveCommentAt) {
    const elapsedMs = Date.now() - new Date(taskLink.lastAutosaveCommentAt).getTime();
    if (elapsedMs < AUTOSAVE_COMMENT_CONFIG.cooldownMs) {
      return;
    }
  }

  const accessToken = await getAsanaAccessToken(event, context);
  if (!accessToken) {
    throw new Error(VALIDATION_MESSAGES.tokenRequired);
  }

  await addCommentToTask(accessToken, taskLink.taskGid, AUTOSAVE_COMMENT_CONFIG.commentText);
  await recordAutosaveComment(cma, entryId);
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const topic = getTopic(event);
  const body = event.body as EntryProps<KeyValueMap>;

  if (topic?.includes('Entry.auto_save')) {
    await handleAutoSave(body, event, context);
    return;
  }

  if (!topic?.includes('Entry.publish')) {
    return;
  }

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

  const accessToken = await getAsanaAccessToken(event, context);
  if (!accessToken) {
    throw new Error(VALIDATION_MESSAGES.tokenRequired);
  }

  const result = await createTaskFromParameters({
    accessToken,
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
