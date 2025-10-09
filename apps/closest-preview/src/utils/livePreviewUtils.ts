import { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { CMAClient, ConfigAppSDK, SidebarAppSDK } from '@contentful/app-sdk';
import { getEntry } from './entryUtils';

export const MAX_DEPTH = 10;

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
        limit: 5,
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

export const getRootEntries = async (
  sdk: SidebarAppSDK
): Promise<{ entries: EntryProps[]; maxDepthReached: boolean }> => {
  const rootEntryData: EntryProps[] = [];
  let childEntries: EntryProps[] = [];
  const checkedEntries: Set<string> = new Set([sdk.ids.entry]);
  let depth = 0;
  let depthReached = false;

  const initialEntry = await getEntry(sdk);

  if (!initialEntry) {
    return { entries: [], maxDepthReached: false };
  }

  childEntries = [initialEntry];

  while (childEntries.length > 0 && depth < MAX_DEPTH) {
    const relatedEntries = await Promise.all(
      childEntries.map((entry) => getRelatedEntries(sdk, entry.sys.id))
    );

    childEntries = relatedEntries.flatMap((rEntry) =>
      rEntry.filter((item: EntryProps) => {
        return splitEntriesFromRoot(item, checkedEntries, rootEntryData, sdk.locales.default);
      })
    );

    depth++;
  }

  if (depth >= MAX_DEPTH) {
    depthReached = true;
  }

  return { entries: rootEntryData, maxDepthReached: depthReached };
};
