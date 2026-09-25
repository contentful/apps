import {
  TASK_LINK_CONTENT_TYPE_ID,
  TASK_LINK_CONTENT_TYPE_NAME,
  TASK_LINK_FIELD_IDS,
} from '../const';
import type { AsanaTask, PrimaryAsanaTaskLink } from '../types';

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

/**
 * Ensures the "Asana Integration (do not delete)" content type exists, creating and publishing
 * it if necessary. Safe to call repeatedly (e.g. on every configure).
 */
export async function ensureTaskLinkContentType(cma: any): Promise<void> {
  try {
    await cma.contentType.get({ contentTypeId: TASK_LINK_CONTENT_TYPE_ID });
    return;
  } catch {
    // Content type does not exist yet, fall through to create it.
  }

  const contentType = await cma.contentType.createWithId(
    { contentTypeId: TASK_LINK_CONTENT_TYPE_ID },
    {
      name: TASK_LINK_CONTENT_TYPE_NAME,
      description:
        'Created automatically by the Asana app to store links between Contentful entries and Asana tasks. Do not delete or modify manually.',
      displayField: TASK_LINK_FIELD_IDS.taskName,
      fields: [
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
      ],
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
  };
}

/**
 * Finds the raw link entry for a given Contentful entry, or null if none exists.
 */
export async function findTaskLinkEntry(cma: any, entryId: string): Promise<any | null> {
  try {
    const response = await cma.entry.getMany({
      query: {
        content_type: TASK_LINK_CONTENT_TYPE_ID,
        [`fields.${TASK_LINK_FIELD_IDS.contentfulEntryId}`]: entryId,
        limit: 1,
      },
    });
    return response.items?.[0] ?? null;
  } catch (error) {
    console.error('Error finding Asana task link entry:', error);
    return null;
  }
}

/**
 * Returns the Asana task link for a given Contentful entry, or null if the entry isn't linked.
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

export interface SaveTaskLinkOptions {
  entryId: string;
  contentTypeId?: string;
  task: AsanaTask;
}

/**
 * Creates or updates the link entry for a given Contentful entry, publishing it so it's visible
 * to CMA reads that filter on published state.
 */
export async function saveTaskLinkForEntry(
  cma: any,
  { entryId, contentTypeId, task }: SaveTaskLinkOptions
): Promise<PrimaryAsanaTaskLink | null> {
  await ensureTaskLinkContentType(cma);
  const defaultLocale = await getDefaultLocale(cma);

  const fields: Record<string, Record<string, unknown>> = {
    [TASK_LINK_FIELD_IDS.contentfulEntryId]: { [defaultLocale]: entryId },
    [TASK_LINK_FIELD_IDS.contentTypeId]: { [defaultLocale]: contentTypeId },
    [TASK_LINK_FIELD_IDS.taskGid]: { [defaultLocale]: task.gid },
    [TASK_LINK_FIELD_IDS.taskUrl]: { [defaultLocale]: task.permalinkUrl },
    [TASK_LINK_FIELD_IDS.taskName]: { [defaultLocale]: task.name },
    [TASK_LINK_FIELD_IDS.taskDescription]: { [defaultLocale]: task.description },
    [TASK_LINK_FIELD_IDS.status]: { [defaultLocale]: task.status },
    [TASK_LINK_FIELD_IDS.assigneeName]: { [defaultLocale]: task.assigneeName },
    [TASK_LINK_FIELD_IDS.dueDate]: { [defaultLocale]: task.dueDate },
    [TASK_LINK_FIELD_IDS.lastSyncedAt]: { [defaultLocale]: new Date().toISOString() },
  };

  const existingEntry = await findTaskLinkEntry(cma, entryId);

  const entry = existingEntry
    ? await cma.entry.update(
        { entryId: existingEntry.sys.id },
        { ...existingEntry, fields: { ...existingEntry.fields, ...fields } }
      )
    : await cma.entry.create({ contentTypeId: TASK_LINK_CONTENT_TYPE_ID }, { fields });

  const publishedEntry = await cma.entry.publish({ entryId: entry.sys.id }, entry);

  return toPrimaryTaskLink(publishedEntry, defaultLocale);
}

/**
 * Removes the link entry for a given Contentful entry, if one exists.
 */
export async function deleteTaskLinkForEntry(cma: any, entryId: string): Promise<void> {
  const existingEntry = await findTaskLinkEntry(cma, entryId);
  if (!existingEntry) {
    return;
  }

  try {
    if (existingEntry.sys.publishedVersion) {
      await cma.entry.unpublish({ entryId: existingEntry.sys.id });
    }
  } catch (error) {
    console.error('Error unpublishing Asana task link entry:', error);
  }

  await cma.entry.delete({ entryId: existingEntry.sys.id });
}
