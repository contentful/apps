import { ContentType, PageAppSDK } from '@contentful/app-sdk';
import { EntryToCreate } from '../../functions/agents/documentParserAgent/schema';

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
