import {
  TASK_LINK_CONTENT_TYPE_ID,
  TASK_LINK_CONTENT_TYPE_NAME,
  TASK_LINK_FIELD_IDS,
} from '../const';
import type { AsanaTask, AsanaTaskLink, PrimaryAsanaTaskLink } from '../types';

/**
 * The Asana app stores entry <-> Asana task links in a dedicated, app-owned content type
 * ("Asana Integration (do not delete)") instead of requiring host content types to carry
 * Asana-specific fields. This mirrors the pattern used by the Braze and Klaviyo apps, which
 * each create their own hidden content type to hold integration data.
 *
 * This module is intentionally typed loosely against `cma: any` so it can be shared between:
 *  - the frontend (`sdk.cma` from `@contentful/react-apps-toolkit`, e.g. `ConfigAppSDK`/`SidebarAppSDK`)
 *  - App Functions (`context.cma`, a `PlainClientAPI`)
 * which have slightly different CMA client typings.
 */

const DEFAULT_LOCALE_FALLBACK = 'en-US';

async function getDefaultLocale(cma: any): Promise<string> {
  try {
    const locales = await cma.locale.getMany({ query: { limit: 1000 } });
    const defaultLocale = locales.items?.find((locale: { default?: boolean }) => locale.default);
    return defaultLocale?.code || DEFAULT_LOCALE_FALLBACK;
  } catch (error) {
    console.error('Error fetching default locale:', error);
    return DEFAULT_LOCALE_FALLBACK;
  }
}

const TASK_LINK_FIELD_DEFINITIONS = [
  {
    id: TASK_LINK_FIELD_IDS.contentfulEntryId,
    name: 'Contentful Entry ID',
    type: 'Symbol',
    required: true,
  },
  {
    id: TASK_LINK_FIELD_IDS.contentTypeId,
    name: 'Contentful Content Type ID',
    type: 'Symbol',
    required: false,
  },
  {
    id: TASK_LINK_FIELD_IDS.taskGid,
    name: 'Asana Task GID',
    type: 'Symbol',
    required: true,
  },
  {
    id: TASK_LINK_FIELD_IDS.taskUrl,
    name: 'Asana Task URL',
    type: 'Symbol',
    required: false,
  },
  {
    id: TASK_LINK_FIELD_IDS.taskName,
    name: 'Asana Task Name',
    type: 'Symbol',
    required: false,
  },
  {
    id: TASK_LINK_FIELD_IDS.taskDescription,
    name: 'Asana Task Description',
    type: 'Text',
    required: false,
  },
  {
    id: TASK_LINK_FIELD_IDS.status,
    name: 'Asana Task Status',
    type: 'Symbol',
    required: false,
  },
  {
    id: TASK_LINK_FIELD_IDS.assigneeName,
    name: 'Asana Assignee Name',
    type: 'Symbol',
    required: false,
  },
  {
    id: TASK_LINK_FIELD_IDS.dueDate,
    name: 'Asana Due Date',
    type: 'Symbol',
    required: false,
  },
  {
    id: TASK_LINK_FIELD_IDS.lastSyncedAt,
    name: 'Last Synced At',
    type: 'Symbol',
    required: false,
  },
  {
    id: TASK_LINK_FIELD_IDS.lastAutosaveCommentAt,
    name: 'Last Autosave Comment At',
    type: 'Symbol',
    required: false,
  },
  {
    id: TASK_LINK_FIELD_IDS.isPrimary,
    name: 'Is Primary Task',
    type: 'Boolean',
    required: false,
  },
] as const;

/**
 * Ensures the "Asana Integration (do not delete)" content type exists, creating and publishing
 * it if necessary, and patches in any fields that were added to the schema after an installation
 * already created it (e.g. `lastAutosaveCommentAt`). Safe to call repeatedly (e.g. on every
 * configure, or before every autosave comment check).
 */
export async function ensureTaskLinkContentType(cma: any): Promise<void> {
  let existingContentType: { fields?: Array<{ id: string }> } | undefined;
  try {
    existingContentType = await cma.contentType.get({ contentTypeId: TASK_LINK_CONTENT_TYPE_ID });
  } catch {
    // Content type does not exist yet, fall through to create it.
  }

  if (existingContentType) {
    const existingFields = existingContentType.fields ?? [];
    const existingFieldIds = new Set(existingFields.map((field) => field.id));
    const missingFields = TASK_LINK_FIELD_DEFINITIONS.filter(
      (field) => !existingFieldIds.has(field.id)
    );

    if (missingFields.length === 0) {
      return;
    }

    const updatedContentType = await cma.contentType.update(
      { contentTypeId: TASK_LINK_CONTENT_TYPE_ID },
      {
        ...existingContentType,
        fields: [...existingFields, ...missingFields],
      }
    );
    await cma.contentType.publish({ contentTypeId: TASK_LINK_CONTENT_TYPE_ID }, updatedContentType);
    return;
  }

  const contentType = await cma.contentType.createWithId(
    { contentTypeId: TASK_LINK_CONTENT_TYPE_ID },
    {
      name: TASK_LINK_CONTENT_TYPE_NAME,
      description:
        'Created automatically by the Asana app to store links between Contentful entries and Asana tasks. Do not delete or modify manually.',
      displayField: TASK_LINK_FIELD_IDS.taskName,
      fields: TASK_LINK_FIELD_DEFINITIONS,
    }
  );

  await cma.contentType.publish({ contentTypeId: TASK_LINK_CONTENT_TYPE_ID }, contentType);
}

function toPrimaryTaskLink(entry: any, locale: string): PrimaryAsanaTaskLink | null {
  const fields = entry?.fields ?? {};
  const getValue = (fieldId: string) => fields[fieldId]?.[locale];

  const entryId = getValue(TASK_LINK_FIELD_IDS.contentfulEntryId);
  const taskGid = getValue(TASK_LINK_FIELD_IDS.taskGid);
  const taskUrl = getValue(TASK_LINK_FIELD_IDS.taskUrl);
  const taskName = getValue(TASK_LINK_FIELD_IDS.taskName);

  if (!entryId || !taskGid || !taskUrl || !taskName) {
    return null;
  }

  return {
    entryId,
    taskGid,
    taskUrl,
    taskName,
    taskDescription: getValue(TASK_LINK_FIELD_IDS.taskDescription) || undefined,
    status: getValue(TASK_LINK_FIELD_IDS.status) || undefined,
    assigneeName: getValue(TASK_LINK_FIELD_IDS.assigneeName) || undefined,
    dueDate: getValue(TASK_LINK_FIELD_IDS.dueDate) || undefined,
    lastSyncedAt: getValue(TASK_LINK_FIELD_IDS.lastSyncedAt) || undefined,
    lastAutosaveCommentAt: getValue(TASK_LINK_FIELD_IDS.lastAutosaveCommentAt) || undefined,
  };
}

/**
 * Finds every raw link entry for a given Contentful entry (the primary link plus any additional,
 * secondary links), or an empty array if none exist.
 */
async function findAllTaskLinkEntries(cma: any, entryId: string): Promise<any[]> {
  try {
    const response = await cma.entry.getMany({
      query: {
        content_type: TASK_LINK_CONTENT_TYPE_ID,
        [`fields.${TASK_LINK_FIELD_IDS.contentfulEntryId}`]: entryId,
        limit: 100,
      },
    });
    return response.items ?? [];
  } catch (error) {
    console.error('Error finding Asana task link entries:', error);
    return [];
  }
}

// Link entries created before the `isPrimary` field existed have no value for it - treat those
// (and any explicit `true`) as the primary link, so pre-existing single-task links keep working.
function isPrimaryLinkEntry(entry: any, locale: string): boolean {
  return entry?.fields?.[TASK_LINK_FIELD_IDS.isPrimary]?.[locale] !== false;
}

/**
 * Finds the raw primary link entry for a given Contentful entry, or null if none exists.
 */
export async function findTaskLinkEntry(cma: any, entryId: string): Promise<any | null> {
  const entries = await findAllTaskLinkEntries(cma, entryId);
  if (entries.length === 0) {
    return null;
  }

  const defaultLocale = await getDefaultLocale(cma);
  return entries.find((entry) => isPrimaryLinkEntry(entry, defaultLocale)) ?? null;
}

/**
 * Returns the primary Asana task link for a given Contentful entry - the one automations resolve
 * via `entryId` - or null if the entry isn't linked.
 */
export async function getTaskLinkForEntry(
  cma: any,
  entryId: string
): Promise<PrimaryAsanaTaskLink | null> {
  const entry = await findTaskLinkEntry(cma, entryId);
  if (!entry) {
    return null;
  }

  const defaultLocale = await getDefaultLocale(cma);
  return toPrimaryTaskLink(entry, defaultLocale);
}

/**
 * Returns every Asana task linked to a given Contentful entry - the primary link (if any) first,
 * followed by any additional, secondary links.
 */
export async function getAllTaskLinksForEntry(cma: any, entryId: string): Promise<AsanaTaskLink[]> {
  const entries = await findAllTaskLinkEntries(cma, entryId);
  if (entries.length === 0) {
    return [];
  }

  const defaultLocale = await getDefaultLocale(cma);

  const links = entries
    .map((entry) => {
      const link = toPrimaryTaskLink(entry, defaultLocale);
      if (!link) {
        return null;
      }
      return {
        ...link,
        linkEntryId: entry.sys.id,
        isPrimary: isPrimaryLinkEntry(entry, defaultLocale),
      };
    })
    .filter((link): link is AsanaTaskLink => link !== null);

  return links.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
}

export interface SaveTaskLinkOptions {
  entryId: string;
  contentTypeId?: string;
  task: AsanaTask;
}

// The task-derived fields shared by every link entry (primary or secondary), independent of
// which Contentful entry it's attached to or whether it's the primary link.
function buildTaskFields(
  defaultLocale: string,
  task: AsanaTask
): Record<string, Record<string, unknown>> {
  return {
    [TASK_LINK_FIELD_IDS.taskGid]: { [defaultLocale]: task.gid },
    [TASK_LINK_FIELD_IDS.taskUrl]: { [defaultLocale]: task.permalinkUrl },
    [TASK_LINK_FIELD_IDS.taskName]: { [defaultLocale]: task.name },
    [TASK_LINK_FIELD_IDS.taskDescription]: { [defaultLocale]: task.description },
    [TASK_LINK_FIELD_IDS.status]: { [defaultLocale]: task.status },
    [TASK_LINK_FIELD_IDS.assigneeName]: { [defaultLocale]: task.assigneeName },
    [TASK_LINK_FIELD_IDS.dueDate]: { [defaultLocale]: task.dueDate },
    [TASK_LINK_FIELD_IDS.lastSyncedAt]: { [defaultLocale]: new Date().toISOString() },
  };
}

/**
 * Creates or updates the *primary* link entry for a given Contentful entry (the one automations
 * resolve via `entryId`), publishing it so it's visible to CMA reads that filter on published
 * state.
 */
export async function saveTaskLinkForEntry(
  cma: any,
  { entryId, contentTypeId, task }: SaveTaskLinkOptions
): Promise<AsanaTaskLink | null> {
  await ensureTaskLinkContentType(cma);
  const defaultLocale = await getDefaultLocale(cma);

  const fields: Record<string, Record<string, unknown>> = {
    [TASK_LINK_FIELD_IDS.contentfulEntryId]: { [defaultLocale]: entryId },
    [TASK_LINK_FIELD_IDS.contentTypeId]: { [defaultLocale]: contentTypeId },
    [TASK_LINK_FIELD_IDS.isPrimary]: { [defaultLocale]: true },
    ...buildTaskFields(defaultLocale, task),
  };

  const existingEntry = await findTaskLinkEntry(cma, entryId);

  const entry = existingEntry
    ? await cma.entry.update(
        { entryId: existingEntry.sys.id },
        { ...existingEntry, fields: { ...existingEntry.fields, ...fields } }
      )
    : await cma.entry.create({ contentTypeId: TASK_LINK_CONTENT_TYPE_ID }, { fields });

  const publishedEntry = await cma.entry.publish({ entryId: entry.sys.id }, entry);

  const link = toPrimaryTaskLink(publishedEntry, defaultLocale);
  return link ? { ...link, linkEntryId: publishedEntry.sys.id, isPrimary: true } : null;
}

/**
 * Creates an additional, secondary link entry for a given Contentful entry - unlike
 * `saveTaskLinkForEntry`, this always creates a new link rather than updating an existing one,
 * so an entry can accumulate more than one linked Asana task.
 */
export async function addSecondaryTaskLinkForEntry(
  cma: any,
  { entryId, contentTypeId, task }: SaveTaskLinkOptions
): Promise<AsanaTaskLink | null> {
  await ensureTaskLinkContentType(cma);
  const defaultLocale = await getDefaultLocale(cma);

  const fields: Record<string, Record<string, unknown>> = {
    [TASK_LINK_FIELD_IDS.contentfulEntryId]: { [defaultLocale]: entryId },
    [TASK_LINK_FIELD_IDS.contentTypeId]: { [defaultLocale]: contentTypeId },
    [TASK_LINK_FIELD_IDS.isPrimary]: { [defaultLocale]: false },
    ...buildTaskFields(defaultLocale, task),
  };

  const entry = await cma.entry.create({ contentTypeId: TASK_LINK_CONTENT_TYPE_ID }, { fields });
  const publishedEntry = await cma.entry.publish({ entryId: entry.sys.id }, entry);

  const link = toPrimaryTaskLink(publishedEntry, defaultLocale);
  return link ? { ...link, linkEntryId: publishedEntry.sys.id, isPrimary: false } : null;
}

/**
 * Refreshes the task-derived fields (name, status, assignee, etc.) on an existing link entry,
 * identified by its own sys.id - works for either the primary link or a secondary one.
 */
export async function updateTaskLink(
  cma: any,
  linkEntryId: string,
  task: AsanaTask
): Promise<AsanaTaskLink | null> {
  const defaultLocale = await getDefaultLocale(cma);
  const existingEntry = await cma.entry.get({ entryId: linkEntryId });

  const updatedEntry = await cma.entry.update(
    { entryId: linkEntryId },
    {
      ...existingEntry,
      fields: { ...existingEntry.fields, ...buildTaskFields(defaultLocale, task) },
    }
  );
  const publishedEntry = await cma.entry.publish({ entryId: updatedEntry.sys.id }, updatedEntry);

  const link = toPrimaryTaskLink(publishedEntry, defaultLocale);
  if (!link) {
    return null;
  }
  return {
    ...link,
    linkEntryId: publishedEntry.sys.id,
    isPrimary: isPrimaryLinkEntry(publishedEntry, defaultLocale),
  };
}

/**
 * Removes a link entry identified by its own sys.id - works for either the primary link or a
 * secondary one.
 */
export async function deleteTaskLinkEntry(cma: any, linkEntryId: string): Promise<void> {
  const existingEntry = await cma.entry.get({ entryId: linkEntryId });

  try {
    if (existingEntry.sys.publishedVersion) {
      await cma.entry.unpublish({ entryId: linkEntryId });
    }
  } catch (error) {
    console.error('Error unpublishing Asana task link entry:', error);
  }

  await cma.entry.delete({ entryId: linkEntryId });
}

/**
 * Records that an autosave-triggered comment was just posted for a linked entry, so the
 * app event handler's cooldown check can see it on the next autosave. No-op if the entry
 * isn't linked to a task (shouldn't happen - callers only invoke this after a successful post).
 */
export async function recordAutosaveComment(cma: any, entryId: string): Promise<void> {
  const existingEntry = await findTaskLinkEntry(cma, entryId);
  if (!existingEntry) {
    return;
  }

  const defaultLocale = await getDefaultLocale(cma);
  const updatedEntry = await cma.entry.update(
    { entryId: existingEntry.sys.id },
    {
      ...existingEntry,
      fields: {
        ...existingEntry.fields,
        [TASK_LINK_FIELD_IDS.lastAutosaveCommentAt]: {
          ...existingEntry.fields[TASK_LINK_FIELD_IDS.lastAutosaveCommentAt],
          [defaultLocale]: new Date().toISOString(),
        },
      },
    }
  );

  await cma.entry.publish({ entryId: updatedEntry.sys.id }, updatedEntry);
}

/**
 * Removes the *primary* link entry for a given Contentful entry, if one exists.
 */
export async function deleteTaskLinkForEntry(cma: any, entryId: string): Promise<void> {
  const existingEntry = await findTaskLinkEntry(cma, entryId);
  if (!existingEntry) {
    return;
  }

  await deleteTaskLinkEntry(cma, existingEntry.sys.id);
}
