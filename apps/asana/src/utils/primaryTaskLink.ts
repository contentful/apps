import type {
  AppInstallationParameters,
  ContentTypeFieldOption,
  PrimaryAsanaTaskLink,
  PrimaryAsanaTaskLinkValue,
  PrimaryTaskLinkFieldMapping,
} from '../types';
import { PRIMARY_TASK_LINK_FIELD_IDS } from '../const';

export const getDefaultPrimaryTaskLinkMapping = (
  fields: ContentTypeFieldOption[]
): PrimaryTaskLinkFieldMapping | null => {
  const fieldIds = new Set(fields.map((field) => field.id));

  if (fieldIds.has(PRIMARY_TASK_LINK_FIELD_IDS.objectFieldId)) {
    return {
      objectFieldId: PRIMARY_TASK_LINK_FIELD_IDS.objectFieldId,
      taskGidFieldId: fieldIds.has(PRIMARY_TASK_LINK_FIELD_IDS.taskGidFieldId)
        ? PRIMARY_TASK_LINK_FIELD_IDS.taskGidFieldId
        : undefined,
      taskUrlFieldId: fieldIds.has(PRIMARY_TASK_LINK_FIELD_IDS.taskUrlFieldId)
        ? PRIMARY_TASK_LINK_FIELD_IDS.taskUrlFieldId
        : undefined,
      taskNameFieldId: fieldIds.has(PRIMARY_TASK_LINK_FIELD_IDS.taskNameFieldId)
        ? PRIMARY_TASK_LINK_FIELD_IDS.taskNameFieldId
        : undefined,
    };
  }

  if (
    fieldIds.has(PRIMARY_TASK_LINK_FIELD_IDS.taskGidFieldId) &&
    fieldIds.has(PRIMARY_TASK_LINK_FIELD_IDS.taskUrlFieldId) &&
    fieldIds.has(PRIMARY_TASK_LINK_FIELD_IDS.taskNameFieldId)
  ) {
    return {
      taskGidFieldId: PRIMARY_TASK_LINK_FIELD_IDS.taskGidFieldId,
      taskUrlFieldId: PRIMARY_TASK_LINK_FIELD_IDS.taskUrlFieldId,
      taskNameFieldId: PRIMARY_TASK_LINK_FIELD_IDS.taskNameFieldId,
    };
  }

  return null;
};

export const getPrimaryTaskLinkMapping = (
  parameters: AppInstallationParameters,
  contentTypeId: string,
  fields: ContentTypeFieldOption[] = []
): PrimaryTaskLinkFieldMapping | null => {
  const configuredMapping = parameters.primaryTaskLinkMappings?.[contentTypeId];
  const defaultMapping = getDefaultPrimaryTaskLinkMapping(fields);

  // Prefer the canonical object field when the content type provides it, even if
  // saved installation parameters still point at an older 3-field mapping.
  if (defaultMapping?.objectFieldId) {
    return defaultMapping;
  }

  return configuredMapping ?? defaultMapping;
};

export const getEligiblePrimaryTaskLinkFields = (
  fields: ContentTypeFieldOption[]
): ContentTypeFieldOption[] => {
  return fields.filter((field) => field.type === 'Symbol' || field.type === 'Text');
};

export const getMappedPrimaryTaskLinkFieldIds = (
  mapping: PrimaryTaskLinkFieldMapping | null | undefined
): string[] => {
  if (!mapping) {
    return [];
  }

  if (mapping.objectFieldId) {
    return [mapping.objectFieldId];
  }

  return Array.from(
    new Set([mapping.taskGidFieldId, mapping.taskUrlFieldId, mapping.taskNameFieldId].filter(Boolean))
  ) as string[];
};

export const buildPrimaryTaskLinkFromEntryValues = (
  fieldValues: Record<string, PrimaryAsanaTaskLinkValue | string | undefined>,
  mapping: PrimaryTaskLinkFieldMapping
): PrimaryAsanaTaskLink | null => {
  const objectFieldValue = mapping.objectFieldId
    ? fieldValues[mapping.objectFieldId]
    : undefined;

  if (objectFieldValue && typeof objectFieldValue === 'object' && !Array.isArray(objectFieldValue)) {
    const taskGid = objectFieldValue.taskGid?.trim();
    const taskUrl = objectFieldValue.taskUrl?.trim();
    const taskName = objectFieldValue.taskName?.trim();

    if (taskGid && taskUrl && taskName) {
      return {
        entryId: '',
        taskGid,
        taskUrl,
        taskName,
        taskDescription: objectFieldValue.taskDescription,
        status: objectFieldValue.status,
        assigneeName: objectFieldValue.assigneeName,
        dueDate: objectFieldValue.dueDate,
        lastSyncedAt: objectFieldValue.lastSyncedAt,
      };
    }
  }

  const taskGid = mapping.taskGidFieldId ? fieldValues[mapping.taskGidFieldId] : undefined;
  const taskUrl = mapping.taskUrlFieldId ? fieldValues[mapping.taskUrlFieldId] : undefined;
  const taskName = mapping.taskNameFieldId ? fieldValues[mapping.taskNameFieldId] : undefined;

  const trimmedTaskGid = typeof taskGid === 'string' ? taskGid.trim() : '';
  const trimmedTaskUrl = typeof taskUrl === 'string' ? taskUrl.trim() : '';
  const trimmedTaskName = typeof taskName === 'string' ? taskName.trim() : '';

  if (!trimmedTaskGid || !trimmedTaskUrl || !trimmedTaskName) {
    return null;
  }

  return {
    entryId: '',
    taskGid: trimmedTaskGid,
    taskUrl: trimmedTaskUrl,
    taskName: trimmedTaskName,
  };
};
