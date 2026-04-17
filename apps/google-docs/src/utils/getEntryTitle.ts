import { ContentType, PageAppSDK } from '@contentful/app-sdk';
import type { EntryToCreate } from '@types';
import type { EntryBlockGraphEntry } from '../types/entryBlockGraph';
import { isTextSourceRef } from '../types/entryBlockGraph';

/**
 * Gets the title of an entry by fetching its content type's display field
 */

export interface GetEntryTitleProps {
  sdk: PageAppSDK;
  entry: EntryToCreate;
}

const UNTITLED_ENTRY_LABEL = 'Untitled';

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

  const text = fieldMapping.sourceRefs
    .filter(isTextSourceRef)
    .flatMap((ref) => ref.flattenedRuns)
    .map((run) => run.text)
    .join('')
    .trim();

  return text.length > 0 ? text : UNTITLED_ENTRY_LABEL;
}
