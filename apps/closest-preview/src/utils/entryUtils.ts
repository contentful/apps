import { EntryProps } from 'contentful-management';
import { SidebarAppSDK } from '@contentful/app-sdk';

export const getEntry = async (sdk: SidebarAppSDK): Promise<EntryProps | null> => {
  try {
    return await sdk.cma.entry.get({
      entryId: sdk.ids.entry,
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
    });
  } catch (error) {
    console.error('Failed to fetch entry:', error);
    return null;
  }
};

export const getContentTypesForEntries = async (
  sdk: SidebarAppSDK,
  entries: EntryProps[]
): Promise<Record<string, any>> => {
  const contentTypeIds = [...new Set(entries.map((entry) => entry.sys.contentType.sys.id))];
  const contentTypeMap: Record<string, any> = {};

  for (const id of contentTypeIds) {
    try {
      const contentType = await sdk.cma.contentType.get({
        contentTypeId: id,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
      });
      contentTypeMap[id] = contentType;
    } catch (error) {
      console.error('Error fetching content type:', error);
    }
  }

  return contentTypeMap;
};

export const getDisplayField = (
  entry: EntryProps,
  contentTypes: Record<string, any>,
  defaultLocale: string
): string => {
  const contentType = contentTypes[entry.sys.contentType.sys.id];
  if (contentType) {
    const displayField = contentType.displayField;
    if (displayField && entry.fields[displayField]) {
      return entry.fields[displayField][defaultLocale] || 'Untitled';
    }
  }
  return entry.fields.title?.[defaultLocale] || 'Untitled';
};
