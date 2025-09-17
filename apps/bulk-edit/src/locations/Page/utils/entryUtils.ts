import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { Document } from '@contentful/rich-text-types';
import { Entry, ContentTypeField, Fields } from '../types';
import { ContentTypeProps, EntryProps, QueryOptions } from 'contentful-management';
import { BATCH_FETCHING, DRAFT_STATUS, CHANGED_STATUS, PUBLISHED_STATUS } from './constants';
import { BadgeVariant } from '@contentful/f36-components';

export const getStatusesOptions = (): string[] => {
  return ['Draft', 'Changed', 'Published'];
};

export const getStatusFromEntry = (entry: Entry): string => {
  const { sys } = entry;
  if (!sys.publishedVersion) {
    return 'Draft';
  }
  if (sys.version >= sys.publishedVersion + 2) {
    return 'Changed';
  }
  if (sys.version === sys.publishedVersion + 1) {
    return 'Published';
  }
  return 'Unknown';
};

export const getStatusColor = (status: string): BadgeVariant => {
  switch (status) {
    case 'Draft':
      return 'warning';
    case 'Changed':
      return 'primary';
    case 'Published':
      return 'positive';
    default:
      return 'negative';
  }
};

export const getStatusFlags = (statusLabels: string[]) => {
  return {
    hasDraft: statusLabels.includes(DRAFT_STATUS),
    hasChanged: statusLabels.includes(CHANGED_STATUS),
    hasPublished: statusLabels.includes(PUBLISHED_STATUS),
  };
};

export const isLocationValue = (value: unknown): value is { lat: number; lon: number } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lat' in value &&
    'lon' in value &&
    typeof (value as any).lat === 'number' &&
    typeof (value as any).lon === 'number'
  );
};

export const isLinkValue = (value: unknown): value is { sys: { linkType: string } } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sys' in value &&
    'linkType' in (value as any).sys
  );
};

export const truncate = (str: string, max: number = 20) =>
  str.length > max ? str.slice(0, max) + ' ...' : str;

export const renderFieldValue = (field: ContentTypeField, value: unknown): string => {
  if (field.type === 'Array' && Array.isArray(value)) {
    const count = value.length;
    if (value[0]?.sys?.linkType === 'Entry') {
      return count === 1 ? '1 reference field' : `${count} reference fields`;
    } else if (value[0]?.sys?.linkType === 'Asset') {
      return count === 1 ? '1 asset' : `${count} assets`;
    } else {
      return truncate(value.join(', '));
    }
  }

  if (field.type === 'Location' && isLocationValue(value)) {
    return truncate(`Lat: ${value.lat}, Lon: ${value.lon}`);
  }
  if (field.type === 'Boolean' && typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (field.type === 'Object' && typeof value === 'object' && value !== null) {
    return truncate(JSON.stringify(value));
  }

  if (field.type === 'Link' && isLinkValue(value) && value.sys.linkType === 'Asset') {
    return `1 asset`;
  }
  if (field.type === 'Link' && isLinkValue(value) && value.sys.linkType === 'Entry') {
    return `1 reference field`;
  }

  if (field.type === 'RichText' && typeof value === 'object' && value !== null) {
    return truncate(documentToHtmlString(value as Document));
  }

  if (typeof value === 'object' && value !== null) {
    return '';
  }

  return value !== undefined && value !== null ? truncate(String(value)) : '-';
};

export const getEntryTitle = (
  entry: Entry,
  contentType: ContentTypeProps,
  locale: string
): string => {
  let displayFieldId = contentType.displayField;
  if (!displayFieldId) return 'Untitled';

  const value = entry.fields[displayFieldId]?.[locale];
  if (value === undefined || value === null || value === '') {
    return 'Untitled';
  }
  return String(value);
};

export const getEntryUrl = (entry: Entry, spaceId: string, environmentId: string): string => {
  return `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entry.sys.id}`;
};

export const isCheckboxAllowed = (field: ContentTypeField): boolean => {
  const restrictedTypes = [
    'Location',
    'Date',
    'Asset',
    'Array',
    'Link',
    'ResourceLink',
    'Boolean',
    'Object',
    'RichText',
  ];

  if (!field.type) return false;

  if (restrictedTypes.includes(field.type)) return false;
  return true;
};

/**
 * Returns a new fields object with the given field updated for the specified locale.
 * If the field or locale does not exist, it is created.
 */
export function updateEntryFieldLocalized(
  fields: Fields,
  fieldId: string,
  value: any,
  locale: string
) {
  return {
    ...fields,
    [fieldId]: {
      ...(fields[fieldId] || {}),
      [locale]: value,
    },
  };
}

export function getEntryFieldValue(
  entry: any,
  field: { id: string; locale?: string } | null | undefined,
  defaultLocale: string
): string {
  if (!entry || !field || !field.id) return 'empty field';
  const fieldValue = entry.fields[field.id]?.[field.locale || defaultLocale];
  if (fieldValue === undefined || fieldValue === null) return 'empty field';

  return String(fieldValue) || 'empty field';
}

/**
 * Processes entries in batches with configurable delays to avoid rate limiting.
 * @param entries - Array of entries to process
 * @param updateFunction - Function to call for each entry
 * @param batchSize - Number of entries to process in each batch
 * @param delayMs - Delay in milliseconds between batches
 * @returns Promise that resolves to array of results from updateFunction
 */
export async function processEntriesInBatches(
  entries: EntryProps[],
  updateFunction: (entry: EntryProps) => Promise<{
    success: boolean;
    entry: EntryProps;
  }>,
  batchSize: number,
  delayMs: number
): Promise<{ success: boolean; entry: EntryProps }[]> {
  if (entries.length === 0) {
    return [];
  }

  const results = [];

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    // Process current batch
    const batchResults = await Promise.all(batch.map((entry) => updateFunction(entry)));
    results.push(...batchResults);

    // Add delay between batches (except for the last batch)
    if (i + batchSize < entries.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// Fetch entries in batches to avoid response size limits
export async function fetchEntriesWithBatching(
  sdk: any,
  query: QueryOptions,
  batchSize: number
): Promise<{ entries: EntryProps[]; total: number }> {
  const allEntries: EntryProps[] = [];
  const { skip, limit } = query;
  let batchSkip = skip || 0;
  let total = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const batchQuery = {
        ...query,
        skip: batchSkip,
        limit: batchSize,
      };

      const response = await sdk.cma.entry.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: batchQuery,
      });

      const items = response.items as EntryProps[];
      const batchTotal = response.total || 0;

      // Set total on first batch
      if (total === 0) {
        total = batchTotal;
      }

      allEntries.push(...items);

      // Check if we should continue
      hasMore =
        items.length === batchSize &&
        (limit === undefined || allEntries.length < limit) &&
        allEntries.length < total;

      batchSkip += batchSize;
    } catch (error: any) {
      // If we hit response size limit, reduce batch size and retry
      if (error.message && error.message.includes('Response size too big')) {
        if (batchSize > BATCH_FETCHING.MIN_BATCH_SIZE) {
          const newBatchSize = Math.floor(batchSize / 2);
          console.warn(
            `Response size limit hit, reducing batch size from ${batchSize} to ${newBatchSize}`
          );
          return fetchEntriesWithBatching(sdk, query, newBatchSize);
        } else {
          throw new Error(
            'Unable to fetch entries: response size too large even with minimal batch size'
          );
        }
      } else {
        throw error;
      }
    }
  }

  return { entries: allEntries, total };
}

export const isNumericSearch = (query: string): boolean => {
  return /^\d+$/.test(query.trim());
};

export const filterEntriesByNumericSearch = (
  entries: EntryProps[],
  query: string,
  fields: ContentTypeField[],
  defaultLocale: string
): EntryProps[] => {
  return entries.filter((entry) => {
    // Search in all Symbol fields (like displayName)
    return fields.some((field) => {
      if (field.type !== 'Symbol') return false;

      const fieldValue = entry.fields[field.id]?.[field.locale || defaultLocale];
      if (fieldValue === undefined || fieldValue === null) return false;

      // Check if the field value contains the numeric string
      return String(fieldValue).includes(query);
    });
  });
};
