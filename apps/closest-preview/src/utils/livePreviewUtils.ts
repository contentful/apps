import { EntryProps, KeyValueMap } from 'contentful-management';
import { CMAClient, SidebarAppSDK } from '@contentful/app-sdk';
import { AppInstallationParameters } from '../types';
import { getEntry } from './entryUtils';

export const DEFAULT_PREVIEW_FIELD_IDS = ['slug'];

export const normalizePreviewFieldIds = (
  previewFieldIds: string[] | string | undefined
): string[] => {
  const normalizedFieldIds = (Array.isArray(previewFieldIds) ? previewFieldIds : [previewFieldIds])
    .flatMap((fieldIds) => (fieldIds ?? '').split(','))
    .map((fieldId) => fieldId.trim())
    .filter(Boolean);

  return normalizedFieldIds.length > 0
    ? [...new Set(normalizedFieldIds)]
    : DEFAULT_PREVIEW_FIELD_IDS;
};

export const getPreviewFieldIdsFromInstallationParameters = (
  parameters: AppInstallationParameters | undefined
): string[] => normalizePreviewFieldIds(parameters?.previewFieldIds);

export const hasConfiguredPreviewField = (
  fields: KeyValueMap | undefined,
  defaultLocale: string,
  previewFieldIds: string[]
): boolean =>
  previewFieldIds.some((fieldId) => {
    const localizedValue = fields?.[fieldId]?.[defaultLocale];
    return typeof localizedValue === 'string' ? localizedValue.trim().length > 0 : !!localizedValue;
  });

export const getContentTypesWithoutLivePreview = async (
  cma: CMAClient,
  excludedContentTypesIds: string[] = [],
  previewFieldIds: string[] = DEFAULT_PREVIEW_FIELD_IDS
): Promise<any[]> => {
  try {
    const allContentTypes = await getContentTypes(cma);

    const contentTypesWithoutLivePreview = allContentTypes.filter((contentType) => {
      const isExcluded = excludedContentTypesIds.includes(contentType.sys.id);
      const hasPreviewField = contentType.fields?.some((field: any) =>
        previewFieldIds.includes(field.id)
      );

      return !isExcluded && !hasPreviewField;
    });

    return contentTypesWithoutLivePreview;
  } catch (error) {
    console.error('Error fetching content types without live preview:', error);
    return [];
  }
};

export const getContentTypeIdsWithPreviewFields = async (
  cma: CMAClient,
  previewFieldIds: string[] = DEFAULT_PREVIEW_FIELD_IDS
): Promise<string[]> => {
  try {
    const allContentTypes = await getContentTypes(cma);

    return allContentTypes
      .filter((contentType) =>
        contentType.fields?.some((field: any) => previewFieldIds.includes(field.id))
      )
      .map((contentType) => contentType.sys.id);
  } catch (error) {
    console.error('Error fetching content types with preview fields:', error);
    return [];
  }
};

export const getContentTypes = async (cma: CMAClient): Promise<any[]> => {
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

  return allContentTypes;
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
  previewFieldIds: string[] = DEFAULT_PREVIEW_FIELD_IDS
): boolean => hasConfiguredPreviewField(entry.fields, defaultLocale, previewFieldIds);

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

export const getRootEntries = async (
  sdk: SidebarAppSDK,
  previewFieldIds: string[] = DEFAULT_PREVIEW_FIELD_IDS
): Promise<EntryProps[]> => {
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

    const allRelatedEntries = relatedEntries.flat();

    const entriesWithLivePreview: EntryProps[] = [];
    const entriesWithoutLivePreview: EntryProps[] = [];

    allRelatedEntries.forEach((entry) => {
      if (isNotChecked(entry, checkedEntries)) {
        checkedEntries.add(entry.sys.id);

        if (hasLivePreview(entry, sdk.locales.default, previewFieldIds)) {
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
