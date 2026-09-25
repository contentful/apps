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
  CreateAsanaTaskRequest,
  CreateAsanaTaskResponse,
} from '../src/types';
import { getTaskLinkForEntry, saveTaskLinkForEntry } from '../src/utils/taskLinkStore';
import { getAsanaAccessToken } from './asanaClient';
import { createTaskFromParameters } from './createTaskFromParameters';

type LocalizedFieldValue = Record<string, unknown> | undefined;

type EntryContext = {
  entry: EntryProps<KeyValueMap>;
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
      displayFieldId: 'title',
    };
  }

  try {
    const contentType = await cma.contentType.get({ contentTypeId });
    return {
      entry,
      displayFieldId: contentType.displayField || 'title',
    };
  } catch {
    return {
      entry,
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

    if (await getExistingTaskLink(cma, entryId)) {
      break;
    }

    entryTitle = getEntryTitle(nextEntryContext, titleFieldId);
  }

  return {
    entryContext: nextEntryContext,
    entryTitle,
  };
}

async function getExistingTaskLink(
  cma: PlainClientAPI,
  entryId: string
): Promise<AsanaTask | null> {
  const taskLink = await getTaskLinkForEntry(cma, entryId);
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

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<CreateAsanaTaskResponse> => {
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

  const existingTask = cma && body.entryId ? await getExistingTaskLink(cma, body.entryId) : null;
  if (existingTask) {
    return {
      success: true,
      message: 'Asana task is already linked to this entry.',
      task: existingTask,
      entryLinked: true,
    };
  }

  const accessToken = await getAsanaAccessToken(event, context);
  const result = await createTaskFromParameters({
    accessToken,
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
    await saveTaskLinkForEntry(cma, {
      entryId: entryContext.entry.sys.id,
      contentTypeId: entryContext.entry.sys.contentType?.sys.id,
      task: result.task,
    });
    return {
      ...result,
      entryLinked: true,
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
