import { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { CMAClient, ConfigAppSDK, SidebarAppSDK } from '@contentful/app-sdk';
import { getEntry } from './entryUtils';

export const getContentTypesWithoutLivePreview = async (
  cma: PlainClientAPI | CMAClient,
  sdk: ConfigAppSDK,
  excludedContentTypesIds: string[] = []
): Promise<any[]> => {
  try {
    let allContentTypes: any[] = [];
    let skip = 0;
    const limit = 1000;
    let areMoreContentTypes = true;

    while (areMoreContentTypes) {
      const response = await cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
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
      const hasSlugField = contentType.fields?.some((field: any) => field.id === 'slug');

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
        order: '-sys.updatedAt',
      },
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
    });

    return response.items;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const splitEntriesFromRoot = (
  entry: EntryProps<KeyValueMap>,
  checkedEntries: Set<string>,
  rootEntryData: EntryProps[],
  defaultLocale: string
) => {
  const entryId = entry?.sys?.id;
  if (!entryId || checkedEntries.has(entryId)) {
    return false;
  }

  checkedEntries.add(entryId);
  const slug = entry.fields.slug?.[defaultLocale];
  if (slug) {
    rootEntryData.push(entry);
    return false;
  }

  return true;
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

  const initialEntry = await getEntry(sdk);

  if (!initialEntry) {
    return [];
  }

  childEntries = [initialEntry];

  while (childEntries.length > 0) {
    const relatedEntries = await Promise.all(
      childEntries.map((entry) => getRelatedEntries(sdk, entry.sys.id))
    );

    childEntries = relatedEntries.flatMap((rEntry) =>
      rEntry.filter((item: EntryProps) => {
        return splitEntriesFromRoot(item, checkedEntries, rootEntryData, sdk.locales.default);
      })
    );
  }

  return filterAndOrderEntries(rootEntryData);
};
