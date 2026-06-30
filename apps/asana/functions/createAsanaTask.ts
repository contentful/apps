import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import type {
  AppInstallationParameters,
  AsanaTask,
  ContentTypeFieldOption,
  CreateAsanaTaskRequest,
  CreateAsanaTaskResponse,
  PrimaryAsanaTaskLinkValue,
} from '../src/types';
import {
  buildPrimaryTaskLinkFromEntryValues,
  getDefaultPrimaryTaskLinkMapping,
} from '../src/utils/primaryTaskLink';
import { getPersonalAccessToken } from './asanaClient';
import { createTaskFromParameters } from './createTaskFromParameters';

type LocalizedFieldValue = Record<string, unknown> | undefined;

type EntryContext = {
  entry: EntryProps<KeyValueMap>;
  contentTypeFields: ContentTypeFieldOption[];
  displayFieldId: string;
};

const ENTRY_TITLE_RETRY_ATTEMPTS = 8;
const ENTRY_TITLE_RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTrimmedValue(value?: string) {
  return value?.trim() ?? '';
}

function getFirstLocalizedString(field: LocalizedFieldValue) {
  if (!field) {
    return '';
  }

  for (const value of Object.values(field)) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function getFirstLocalizedFieldValue(field: LocalizedFieldValue) {
  if (!field) {
    return undefined;
  }

  return Object.values(field).find((value) => value !== undefined);
}

async function getDefaultLocale(cma: PlainClientAPI) {
  try {
    const locales = await cma.locale.getMany({ query: { limit: 1000 } });
    const defaultLocale = locales.items.find((locale) => locale.default);
    return defaultLocale?.code ?? 'en-US';
  } catch {
    return 'en-US';
  }
}

async function getEntryContext(
  cma: PlainClientAPI,
  entryId?: string
): Promise<EntryContext | null> {
  const trimmedEntryId = getTrimmedValue(entryId);
  if (!trimmedEntryId) {
    return null;
  }

  const entry = (await cma.entry.get({ entryId: trimmedEntryId })) as EntryProps<KeyValueMap>;
  const contentTypeId = entry.sys.contentType?.sys.id;
  if (!contentTypeId) {
    return {
      entry,
      contentTypeFields: [],
      displayFieldId: 'title',
    };
  }

  try {
    const contentType = await cma.contentType.get({ contentTypeId });
    return {
      entry,
      contentTypeFields: contentType.fields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
      })),
      displayFieldId: contentType.displayField || 'title',
    };
  } catch {
    return {
      entry,
      contentTypeFields: [],
      displayFieldId: 'title',
    };
  }
}

function getEntryTitle(entryContext: EntryContext | null, titleFieldId?: string) {
  if (!entryContext) {
    return '';
  }

  const resolvedTitleFieldId = getTrimmedValue(titleFieldId) || entryContext.displayFieldId;
  const { entry } = entryContext;
  const title = getFirstLocalizedString(entry.fields[resolvedTitleFieldId] as LocalizedFieldValue);

  if (title) {
    return title;
  }

  for (const fallbackFieldId of ['title', 'name', 'heading', 'headline']) {
    const fallbackTitle = getFirstLocalizedString(
      entry.fields[fallbackFieldId] as LocalizedFieldValue
    );

    if (fallbackTitle) {
      return fallbackTitle;
    }
  }

  return '';
}

async function waitForEntryTitle(
  cma: PlainClientAPI,
  entryContext: EntryContext | null,
  entryId: string,
  titleFieldId?: string
) {
  let nextEntryContext = entryContext;
  let entryTitle = getEntryTitle(nextEntryContext, titleFieldId);

  for (let attempt = 0; !entryTitle && attempt < ENTRY_TITLE_RETRY_ATTEMPTS; attempt += 1) {
    await sleep(ENTRY_TITLE_RETRY_DELAY_MS);
    nextEntryContext = await getEntryContext(cma, entryId);

    if (getExistingPrimaryTaskLink(nextEntryContext)) {
      break;
    }

    entryTitle = getEntryTitle(nextEntryContext, titleFieldId);
  }

  return {
    entryContext: nextEntryContext,
    entryTitle,
  };
}

function getExistingPrimaryTaskLink(entryContext: EntryContext | null): AsanaTask | null {
  if (!entryContext) {
    return null;
  }

  const mapping = getDefaultPrimaryTaskLinkMapping(entryContext.contentTypeFields);
  if (!mapping) {
    return null;
  }

  const fieldValues = Object.fromEntries(
    [mapping.objectFieldId, mapping.taskGidFieldId, mapping.taskUrlFieldId, mapping.taskNameFieldId]
      .filter(Boolean)
      .map((fieldId) => [
        fieldId,
        getFirstLocalizedFieldValue(
          entryContext.entry.fields[fieldId as string] as LocalizedFieldValue
        ),
      ])
  ) as Record<string, PrimaryAsanaTaskLinkValue | string | undefined>;

  const taskLink = buildPrimaryTaskLinkFromEntryValues(fieldValues, mapping);
  if (!taskLink) {
    return null;
  }

  return {
    gid: taskLink.taskGid,
    name: taskLink.taskName,
    permalinkUrl: taskLink.taskUrl,
    ...(taskLink.taskDescription ? { description: taskLink.taskDescription } : {}),
    ...(taskLink.status ? { status: taskLink.status } : {}),
    ...(taskLink.assigneeName ? { assigneeName: taskLink.assigneeName } : {}),
    ...(taskLink.dueDate ? { dueDate: taskLink.dueDate } : {}),
  };
}

async function savePrimaryTaskLink(
  cma: PlainClientAPI,
  entryContext: EntryContext | null,
  task: AsanaTask
) {
  if (!entryContext) {
    return false;
  }

  const mapping = getDefaultPrimaryTaskLinkMapping(entryContext.contentTypeFields);
  if (!mapping) {
    return false;
  }

  const locale = await getDefaultLocale(cma);
  const taskLinkValue: PrimaryAsanaTaskLinkValue = {
    taskGid: task.gid,
    taskUrl: task.permalinkUrl,
    taskName: task.name,
    ...(typeof task.description === 'string' ? { taskDescription: task.description } : {}),
    ...(typeof task.status === 'string' ? { status: task.status } : {}),
    ...(typeof task.assigneeName === 'string' ? { assigneeName: task.assigneeName } : {}),
    ...(typeof task.dueDate === 'string' ? { dueDate: task.dueDate } : {}),
    lastSyncedAt: new Date().toISOString(),
  };

  const setLocalizedFieldValue = (fieldId: string, value: unknown) => {
    entryContext.entry.fields[fieldId] = {
      ...((entryContext.entry.fields[fieldId] as Record<string, unknown> | undefined) ?? {}),
      [locale]: value,
    };
  };

  if (mapping.objectFieldId) {
    setLocalizedFieldValue(mapping.objectFieldId, taskLinkValue);
  }

  if (mapping.taskGidFieldId) {
    setLocalizedFieldValue(mapping.taskGidFieldId, task.gid);
  }

  if (mapping.taskUrlFieldId) {
    setLocalizedFieldValue(mapping.taskUrlFieldId, task.permalinkUrl);
  }

  if (mapping.taskNameFieldId) {
    setLocalizedFieldValue(mapping.taskNameFieldId, task.name);
  }

  await cma.entry.update({ entryId: entryContext.entry.sys.id }, entryContext.entry);
  return true;
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<CreateAsanaTaskResponse> => {
  const personalAccessToken = getPersonalAccessToken(event, context);
  const body = (event.body as CreateAsanaTaskRequest | undefined) ?? {};
  const installationParameters = (context.appInstallationParameters ??
    {}) as AppInstallationParameters;
  const cma = context.cma;
  let entryContext: EntryContext | null = null;

  let entryTitle = '';

  try {
    if (body.entryId) {
      if (!cma) {
        throw new Error('Contentful CMA client is not available for entry lookup.');
      }

      entryContext = await getEntryContext(cma, body.entryId);
    }

    entryTitle = getTrimmedValue(body.title) ? '' : getEntryTitle(entryContext, body.titleFieldId);

    if (body.entryId && !getTrimmedValue(body.title) && !entryTitle && cma) {
      const resolvedEntry = await waitForEntryTitle(
        cma,
        entryContext,
        body.entryId,
        body.titleFieldId
      );
      entryContext = resolvedEntry.entryContext;
      entryTitle = resolvedEntry.entryTitle;
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message
          ? error.message
          : 'Could not load the Contentful entry title.',
    };
  }

  const existingTask = getExistingPrimaryTaskLink(entryContext);
  if (existingTask) {
    return {
      success: true,
      message: 'Asana task is already linked to this entry.',
      task: existingTask,
      entryLinked: true,
    };
  }

  const result = await createTaskFromParameters({
    personalAccessToken,
    title: body.title || entryTitle,
    notes: body.notes,
    projectGid: body.projectGid,
    workspaceGid: body.workspaceGid,
    installationParameters,
  });

  if (!result.success || !result.task || !cma || !entryContext) {
    return result;
  }

  try {
    const entryLinked = await savePrimaryTaskLink(cma, entryContext, result.task);
    return {
      ...result,
      entryLinked,
    };
  } catch (error) {
    return {
      ...result,
      entryLinked: false,
      message:
        error instanceof Error && error.message
          ? `${result.message} The task was created, but the entry could not be linked: ${error.message}`
          : `${result.message} The task was created, but the entry could not be linked.`,
    };
  }
};
