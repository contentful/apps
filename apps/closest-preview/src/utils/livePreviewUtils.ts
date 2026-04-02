import { EntryProps, KeyValueMap } from 'contentful-management';
import { CMAClient, SidebarAppSDK } from '@contentful/app-sdk';
import { getEntry } from './entryUtils';
import { DEFAULT_SLUG_FIELD_ID } from '../types';

export const getContentTypesWithoutLivePreview = async (
  cma: CMAClient,
  excludedContentTypesIds: string[] = [],
  slugFieldId: string = DEFAULT_SLUG_FIELD_ID
): Promise<any[]> => {
  try {
    let allContentTypes: any[] = [];
    let skip = 0;
    const limit = 1000;
    let areMoreContentTypes = true;

    while (areMoreContentTypes) {
      const response = await cma.contentType.getMany({
        query: { skip, limit },
      });
      if (response.items) {
        allContentTypes = allContentTypes.concat(response.items);
        areMoreContentTypes = response.items.length === limit;
      } else {
        areMoreContentTypes = false;
      }
      skip += limit;
    }

    const contentTypesWithoutLivePreview = allContentTypes.filter((contentType) => {
      const isExcluded = excludedContentTypesIds.includes(contentType.sys.id);
      const hasSlugField = contentType.fields?.some((field: any) => field.id === slugFieldId);

      return !isExcluded && !hasSlugField;
    });

    return contentTypesWithoutLivePreview;
  } catch (error) {
    console.error('Error fetching content types without live preview:', error);
    return [];
  }
};

export const getRelatedEntries = async (sdk: SidebarAppSDK, id: string): Promise<EntryProps[]> => {
  try {
    const response = await sdk.cma.entry.getMany({
      query: {
        links_to_entry: id,
      },
    });

    return response.items;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const hasLivePreview = (
  entry: EntryProps<KeyValueMap>,
  defaultLocale: string,
  slugFieldId: string = DEFAULT_SLUG_FIELD_ID
): boolean => {
  return !!entry.fields[slugFieldId]?.[defaultLocale];
};

export const isNotChecked = (
  entry: EntryProps<KeyValueMap>,
  checkedEntries: Set<string>
): boolean => {
  const entryId = entry?.sys?.id;
  return !!entryId && !checkedEntries.has(entryId);
};

export const filterAndOrderEntries = (entries: EntryProps[], limit: number = 5): EntryProps[] => {
  return entries
    .sort((a, b) => new Date(b.sys.updatedAt).getTime() - new Date(a.sys.updatedAt).getTime())
    .slice(0, limit);
};

export const getRootEntries = async (sdk: SidebarAppSDK): Promise<EntryProps[]> => {
  const rootEntryData: EntryProps[] = [];
  let childEntries: EntryProps[] = [];
  const checkedEntries: Set<string> = new Set([sdk.ids.entry]);
  const slugFieldId = sdk.parameters.installation.slugFieldId || DEFAULT_SLUG_FIELD_ID;

  const initialEntry = await getEntry(sdk);

  if (!initialEntry) {
    return [];
  }

  childEntries = [initialEntry];

  while (childEntries.length > 0) {
    const relatedEntries = await Promise.all(
      childEntries.map((entry) => getRelatedEntries(sdk, entry.sys.id))
    );

    const allRelatedEntries = relatedEntries.flat();

    const entriesWithLivePreview: EntryProps[] = [];
    const entriesWithoutLivePreview: EntryProps[] = [];

    allRelatedEntries.forEach((entry) => {
      if (isNotChecked(entry, checkedEntries)) {
        checkedEntries.add(entry.sys.id);

        if (hasLivePreview(entry, sdk.locales.default, slugFieldId)) {
          entriesWithLivePreview.push(entry);
        } else {
          entriesWithoutLivePreview.push(entry);
        }
      }
    });

    rootEntryData.push(...entriesWithLivePreview);

    childEntries = entriesWithoutLivePreview;
  }

  return filterAndOrderEntries(rootEntryData);
};
