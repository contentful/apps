import { ContentType, PageAppSDK } from '@contentful/app-sdk';
import { EntryToCreate } from '../../functions/agents/documentParserAgent/schema';
import { EntryProps } from 'contentful-management';

/**
 * Gets the title of an entry by fetching its content type's display field
 */

export interface GetEntryTitleProps {
  sdk: PageAppSDK;
  entry: EntryToCreate;
}

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

export const getEntryDisplayName = (entry: EntryProps, defaultLocale: string): string => {
  // Try to find a 'title' field first
  if (entry.fields.title) {
    const titleValue = entry.fields.title[defaultLocale] || Object.values(entry.fields.title)[0];
    if (titleValue && typeof titleValue === 'string') {
      return titleValue;
    }
  }

  // Fall back to the first text/Symbol field
  for (const [_fieldId, localizedValue] of Object.entries(entry.fields)) {
    if (localizedValue && typeof localizedValue === 'object') {
      const value = localizedValue[defaultLocale] || Object.values(localizedValue)[0];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
  }

  return 'Untitled';
};
