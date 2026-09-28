import type { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import type {
  AppInstallationParameters,
  AsanaCustomField,
  AsanaCustomFieldOption,
} from '../src/types';
import { parseInstallationParameters } from '../src/utils/installationParameters';
import { getTaskLinkForEntry } from '../src/utils/taskLinkStore';
import { getProjectCustomFields, updateTaskCustomField } from './asanaClient';

type LocalizedFieldValue = Record<string, unknown> | undefined;

function getFirstLocalizedValue(field: LocalizedFieldValue): unknown {
  if (!field) {
    return undefined;
  }

  return Object.values(field).find(
    (value) => value !== undefined && value !== null && value !== ''
  );
}

// Converts a raw Contentful field value into the shape Asana expects for `customField`'s type.
// Returns `undefined` (rather than `null`) when the value can't be meaningfully converted, which
// signals the caller to skip syncing that mapping instead of clearing the Asana field.
function convertContentfulValueToAsanaFieldValue(
  rawValue: unknown,
  customField: AsanaCustomField
): unknown {
  switch (customField.type) {
    case 'text': {
      if (typeof rawValue !== 'string') {
        return undefined;
      }
      const trimmed = rawValue.trim();
      return trimmed ? trimmed : null;
    }
    case 'number': {
      const numberValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
      if (rawValue === undefined || rawValue === null || Number.isNaN(numberValue)) {
        return undefined;
      }
      return numberValue;
    }
    case 'enum': {
      if (typeof rawValue !== 'string') {
        return undefined;
      }
      const normalized = rawValue.trim().toLowerCase();
      if (!normalized) {
        return null;
      }
      const match = customField.enumOptions?.find(
        (option) => option.name.trim().toLowerCase() === normalized
      );
      return match?.gid ?? undefined;
    }
    case 'multi_enum': {
      if (!Array.isArray(rawValue)) {
        return undefined;
      }
      const gids = rawValue
        .map((value) => {
          if (typeof value !== 'string') {
            return undefined;
          }
          const normalized = value.trim().toLowerCase();
          return customField.enumOptions?.find(
            (option) => option.name.trim().toLowerCase() === normalized
          );
        })
        .filter((option): option is AsanaCustomFieldOption => Boolean(option))
        .map((option) => option.gid);
      return gids;
    }
    case 'date': {
      if (typeof rawValue !== 'string') {
        return undefined;
      }
      const trimmed = rawValue.trim();
      return trimmed ? { date: trimmed.slice(0, 10) } : null;
    }
    default:
      // `people` and any other custom field types aren't safe to auto-convert from a raw
      // Contentful field value (matching a person requires a gid, not a display value), so
      // those mappings are skipped rather than guessed at.
      return undefined;
  }
}

export interface SyncFieldMappingsResult {
  success: boolean;
  message: string;
  updatedFieldCount: number;
}

export interface SyncFieldMappingsInput {
  cma: PlainClientAPI;
  entry: EntryProps<KeyValueMap>;
  installationParameters: AppInstallationParameters;
  accessToken: string;
}

// Pushes each configured field mapping's current Contentful value into its linked Asana task's
// custom field, for the content type of `entry`. No-ops (successfully) if the entry has no
// matching mappings or isn't linked to an Asana task yet.
export async function syncFieldMappingsForEntry({
  cma,
  entry,
  installationParameters,
  accessToken,
}: SyncFieldMappingsInput): Promise<SyncFieldMappingsResult> {
  const entryId = entry.sys.id;
  const contentTypeId = entry.sys.contentType?.sys?.id;

  const { fieldMappings = [] } = parseInstallationParameters(installationParameters);
  const matchingMappings = fieldMappings.filter(
    (mapping) => mapping.contentTypeId === contentTypeId
  );

  if (matchingMappings.length === 0) {
    return {
      success: true,
      message: 'No field mappings configured for this content type.',
      updatedFieldCount: 0,
    };
  }

  const taskLink = await getTaskLinkForEntry(cma, entryId);
  if (!taskLink?.taskGid) {
    return {
      success: true,
      message: 'Entry is not linked to an Asana task.',
      updatedFieldCount: 0,
    };
  }

  const projectGid = installationParameters.defaultProjectGid;
  if (!projectGid) {
    return {
      success: false,
      message: 'No default Asana project is configured.',
      updatedFieldCount: 0,
    };
  }

  const customFields = await getProjectCustomFields(accessToken, projectGid);
  const customFieldsByGid = new Map(customFields.map((field) => [field.gid, field]));

  let updatedFieldCount = 0;
  for (const mapping of matchingMappings) {
    const customField = customFieldsByGid.get(mapping.asanaCustomFieldGid);
    if (!customField) {
      continue;
    }

    const rawValue = getFirstLocalizedValue(
      entry.fields[mapping.contentfulFieldId] as LocalizedFieldValue
    );
    const asanaValue = convertContentfulValueToAsanaFieldValue(rawValue, customField);
    if (asanaValue === undefined) {
      continue;
    }

    await updateTaskCustomField(
      accessToken,
      taskLink.taskGid,
      mapping.asanaCustomFieldGid,
      asanaValue
    );
    updatedFieldCount += 1;
  }

  return {
    success: true,
    message:
      updatedFieldCount > 0
        ? 'Synced field mappings to Asana.'
        : 'No matching Asana custom fields to sync.',
    updatedFieldCount,
  };
}
