import { PageAppSDK } from '@contentful/app-sdk';
import { EntryToCreate } from '../../functions/agents/documentParserAgent/schema';

/**
 * Gets the title of an entry by fetching its content type's display field
 */
export const fetchEntryTitle = async (
  sdk: PageAppSDK,
  entry: EntryToCreate,
  defaultLocale: string
): Promise<string> => {
  try {
    const space = await sdk.cma.space.get({});
    const contentType = await sdk.cma.contentType.get({
      spaceId: space.sys.id,
      environmentId: space.sys.id,
      contentTypeId: entry.contentTypeId,
    });

    if (!contentType.displayField) return '';

    const value = entry.fields[contentType.displayField]?.[defaultLocale];
    return String(value || '');
  } catch (error) {
    console.error(`Failed to get entry title for ${entry.contentTypeId}:`, error);
    return '';
  }
};
