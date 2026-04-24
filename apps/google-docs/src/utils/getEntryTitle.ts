import { ContentType, PageAppSDK } from '@contentful/app-sdk';
import type { EntryToCreate } from '@types';
import type { EntryBlockGraphEntry } from '../types/entryBlockGraph';
import { isTextSourceRef } from '../types/entryBlockGraph';
import { truncateLabel } from './utils';

/**
 * Gets the title of an entry by fetching its content type's display field
 */

export interface GetEntryTitleProps {
  sdk: PageAppSDK;
  entry: EntryToCreate;
}

const UNTITLED_ENTRY_LABEL = 'Untitled';

/** Max length for overview row titles derived from display-field source refs (before card-level truncate). */
const DISPLAY_FIELD_TITLE_EXCERPT_MAX = 80;

export const getEntryTitle = async ({
  sdk,
  entry,
}: GetEntryTitleProps): Promise<{ title: string; contentTypeName: string }> => {
  try {
    const contentType = await getContentType({ sdk, contentTypeId: entry.contentTypeId });

    const contentTypeName = contentType.name;

    if (!contentType.displayField) return { title: '', contentTypeName };

    const defaultLocale = sdk.locales.default;
    const value = entry.fields[contentType.displayField]?.[defaultLocale];
    return {
      title: String(value || ''),
      contentTypeName,
    };
  } catch (error) {
    console.error(`Failed to get entry title for ${entry.contentTypeId}:`, error);
    return { title: '', contentTypeName: entry.contentTypeId };
  }
};

export interface GetContentTypeProps {
  sdk: PageAppSDK;
  contentTypeId: string;
}

export const getContentType = async ({
  sdk,
  contentTypeId,
}: GetContentTypeProps): Promise<ContentType> => {
  return await sdk.cma.contentType.get({
    contentTypeId,
  });
};

export function getEntryTitleFromFieldMappings(
  entry: EntryBlockGraphEntry,
  displayField?: string
): string {
  if (!displayField) return UNTITLED_ENTRY_LABEL;

  const fieldMapping = entry.fieldMappings.find((mapping) => mapping.fieldId === displayField);
  if (!fieldMapping) return UNTITLED_ENTRY_LABEL;

  const firstTextRef = fieldMapping.sourceRefs.find(isTextSourceRef);
  if (!firstTextRef) return UNTITLED_ENTRY_LABEL;

  const text = firstTextRef.flattenedRuns
    .map((run) => run.text)
    .join('')
    .trim();

  if (!text.length) return UNTITLED_ENTRY_LABEL;

  return truncateLabel(text, DISPLAY_FIELD_TITLE_EXCERPT_MAX);
}
