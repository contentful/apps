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
import { appendEntryLink, buildEntryUrl } from './taskNotes';

type LocalizedFieldValue = Record<string, unknown> | undefined;

type EntryContext = {
  entry: EntryProps<KeyValueMap>;
  displayFieldId: string;
};

// Contentful Functions have a hard 30s wall-clock execution ceiling with no retry on timeout,
// so this budget is intentionally kept well under that: ~18s of sleep here, leaving headroom
// for the CMA lookups already happening each iteration plus the Asana task creation call that
// still has to run after this loop finishes. Title and notes share this single budget (polled
// together each iteration) rather than each getting their own ~18s, to stay under the ceiling.
const ENTRY_FIELD_RETRY_ATTEMPTS = 10;
const ENTRY_FIELD_RETRY_DELAY_MS = 1800;

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

function getEntryFieldValue(
  entryContext: EntryContext | null,
  fieldId: string | undefined,
  defaultFieldId: string,
  fallbackFieldIds: string[]
) {
  if (!entryContext) {
    return '';
  }

  const resolvedFieldId = getTrimmedValue(fieldId) || defaultFieldId;
  const { entry } = entryContext;
  const value = getFirstLocalizedString(entry.fields[resolvedFieldId] as LocalizedFieldValue);

  if (value) {
    return value;
  }

  for (const fallbackFieldId of fallbackFieldIds) {
    const fallbackValue = getFirstLocalizedString(
      entry.fields[fallbackFieldId] as LocalizedFieldValue
    );

    if (fallbackValue) {
      return fallbackValue;
    }
  }

  return '';
}

function getEntryTitle(entryContext: EntryContext | null, titleFieldId?: string) {
  if (!entryContext) {
    return '';
  }

  return getEntryFieldValue(entryContext, titleFieldId, entryContext.displayFieldId, [
    'title',
    'name',
    'heading',
    'headline',
  ]);
}

// Unlike title (which always has a reliable default via the content type's display field), notes
// has no equivalent reliable default - most content types have no "notes"/"description" field at
// all, so guessing one would mean every automation call with no notes mapped waits out the full
// retry budget for a value that will never arrive. Resolution (and the wait/retry below) is only
// attempted when the caller explicitly maps a notesFieldId.
function getEntryNotes(entryContext: EntryContext | null, notesFieldId?: string) {
  const trimmedNotesFieldId = getTrimmedValue(notesFieldId);
  if (!entryContext || !trimmedNotesFieldId) {
    return '';
  }

  return getFirstLocalizedString(
    entryContext.entry.fields[trimmedNotesFieldId] as LocalizedFieldValue
  );
}

// Polls for title and/or notes together (only the fields the caller still needs), on a single
// shared retry budget, so an entry that's missing both doesn't wait twice as long as one missing
// only the title.
async function waitForEntryFields(
  cma: PlainClientAPI,
  entryContext: EntryContext | null,
  entryId: string,
  titleFieldId: string | undefined,
  notesFieldId: string | undefined,
  needsTitle: boolean,
  needsNotes: boolean
) {
  let nextEntryContext = entryContext;
  let entryTitle = needsTitle ? getEntryTitle(nextEntryContext, titleFieldId) : '';
  let entryNotes = needsNotes ? getEntryNotes(nextEntryContext, notesFieldId) : '';
  const isResolved = () => (!needsTitle || entryTitle) && (!needsNotes || entryNotes);

  for (let attempt = 0; !isResolved() && attempt < ENTRY_FIELD_RETRY_ATTEMPTS; attempt += 1) {
    await sleep(ENTRY_FIELD_RETRY_DELAY_MS);
    nextEntryContext = await getEntryContext(cma, entryId);

    if (await getExistingTaskLink(cma, entryId)) {
      break;
    }

    if (needsTitle) {
      entryTitle = getEntryTitle(nextEntryContext, titleFieldId);
    }
    if (needsNotes) {
      entryNotes = getEntryNotes(nextEntryContext, notesFieldId);
    }
  }

  return {
    entryContext: nextEntryContext,
    entryTitle,
    entryNotes,
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
  let entryNotes = '';

  try {
    if (body.entryId) {
      if (!cma) {
        throw new Error('Contentful CMA client is not available for entry lookup.');
      }

      entryContext = await getEntryContext(cma, body.entryId);
    }

    const needsTitle = !getTrimmedValue(body.title);
    // Only attempt (and wait/retry for) notes resolution when the caller explicitly mapped a
    // notesFieldId - see getEntryNotes for why there's no generic fallback guess here.
    const needsNotes = !getTrimmedValue(body.notes) && !!getTrimmedValue(body.notesFieldId);

    entryTitle = needsTitle ? getEntryTitle(entryContext, body.titleFieldId) : '';
    entryNotes = needsNotes ? getEntryNotes(entryContext, body.notesFieldId) : '';

    const stillNeedsTitle = needsTitle && !entryTitle;
    const stillNeedsNotes = needsNotes && !entryNotes;

    if (body.entryId && (stillNeedsTitle || stillNeedsNotes) && cma) {
      const resolvedEntry = await waitForEntryFields(
        cma,
        entryContext,
        body.entryId,
        body.titleFieldId,
        body.notesFieldId,
        stillNeedsTitle,
        stillNeedsNotes
      );
      entryContext = resolvedEntry.entryContext;
      entryTitle = resolvedEntry.entryTitle;
      entryNotes = resolvedEntry.entryNotes;
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
  const notes = body.entryId
    ? appendEntryLink(body.notes || entryNotes, buildEntryUrl(context, body.entryId))
    : body.notes || entryNotes;
  const result = await createTaskFromParameters({
    accessToken,
    title: body.title || entryTitle,
    notes,
    projectGid: body.projectGid,
    workspaceGid: body.workspaceGid,
    installationParameters,
    checkDuplicateName: body.checkDuplicateName,
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
