import { CollectionProp, ContentTypeProps, EntryProps } from 'contentful-management';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { REDIRECT_CONTENT_TYPE_ID } from './consts';

export interface FetchRedirectsResult {
  redirects: EntryProps[];
  total: number;
  fetchedAt: Date;
}

type ReferencedEntriesById = Map<string, EntryProps>;
type ContentTypesById = Map<string, ContentTypeProps>;
type SlugFieldIdsByContentTypeId = Map<string, string>;

interface ReferencedEntriesAndContentTypesResult {
  referencedEntriesById: ReferencedEntriesById;
  contentTypesById: ContentTypesById;
  slugFieldIdsByContentTypeId: SlugFieldIdsByContentTypeId;
}

export const fetchRedirects = async (
  sdk: HomeAppSDK | PageAppSDK
): Promise<FetchRedirectsResult> => {
  try {
    const response = await sdk.cma.entry.getMany({
      query: {
        limit: 100,
        skip: 0,
        content_type: REDIRECT_CONTENT_TYPE_ID,
      },
    });

    const { referencedEntriesById, contentTypesById, slugFieldIdsByContentTypeId } =
      await getReferencedEntriesAndContentTypes(sdk, sdk.locales.default, response);

    const redirects = buildStructure(
      response.items as EntryProps[],
      sdk.locales.default,
      referencedEntriesById,
      contentTypesById,
      slugFieldIdsByContentTypeId
    );

    return {
      redirects,
      total: response.total,
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error('Error fetching redirects:', error);
    throw error;
  }
};

const getReferencedEntriesAndContentTypes = async (
  sdk: HomeAppSDK | PageAppSDK,
  defaultLocale: string,
  response: CollectionProp<EntryProps>
): Promise<ReferencedEntriesAndContentTypesResult> => {
  const referencedEntryIds = collectReferencedEntryIds(response.items, defaultLocale);

  let referencedEntriesById: ReferencedEntriesById = new Map();
  let contentTypesById: ContentTypesById = new Map();
  let slugFieldIdsByContentTypeId: SlugFieldIdsByContentTypeId = new Map();

  if (!referencedEntryIds.size) {
    return {
      referencedEntriesById,
      contentTypesById,
      slugFieldIdsByContentTypeId,
    };
  }

  const referencedEntries = await fetchEntriesByIds(sdk, referencedEntryIds);
  referencedEntriesById = new Map(referencedEntries.map((entry) => [entry.sys.id, entry]));

  const contentTypeIds = extractContentTypeIds(referencedEntries);

  if (!contentTypeIds.length) {
    return {
      referencedEntriesById,
      contentTypesById,
      slugFieldIdsByContentTypeId,
    };
  }

  const contentTypes = await fetchContentTypesByIds(sdk, contentTypeIds);
  contentTypesById = new Map(contentTypes.map((contentType) => [contentType.sys.id, contentType]));

  slugFieldIdsByContentTypeId = await getSlugFieldIdsByContentTypeId(sdk, contentTypeIds);

  return {
    referencedEntriesById,
    contentTypesById,
    slugFieldIdsByContentTypeId,
  };
};

const collectReferencedEntryIds = (items: EntryProps[], defaultLocale: string): Set<string> => {
  const referencedIds = new Set<string>();

  items.forEach((item) => {
    const redirectFromFieldId = item.fields.redirectFromContentTypes?.[defaultLocale]?.sys?.id;
    const redirectToFieldId = item.fields.redirectToContentTypes?.[defaultLocale]?.sys?.id;

    if (redirectFromFieldId) {
      referencedIds.add(redirectFromFieldId);
    }

    if (redirectToFieldId) {
      referencedIds.add(redirectToFieldId);
    }
  });

  return referencedIds;
};

const fetchEntriesByIds = async (
  sdk: HomeAppSDK | PageAppSDK,
  ids: Set<string>
): Promise<EntryProps[]> => {
  if (!ids.size) {
    return [];
  }

  const response = await sdk.cma.entry.getMany({
    query: {
      'sys.id[in]': Array.from(ids).join(','),
      limit: ids.size,
    },
  });

  return response.items as EntryProps[];
};

const extractContentTypeIds = (entries: EntryProps[]): string[] => {
  const contentTypeIds = new Set<string>();

  entries.forEach((entry) => {
    const contentTypeId = entry.sys.contentType?.sys.id;

    if (contentTypeId) {
      contentTypeIds.add(contentTypeId);
    }
  });

  return Array.from(contentTypeIds);
};

const fetchContentTypesByIds = async (
  sdk: HomeAppSDK | PageAppSDK,
  ids: string[]
): Promise<ContentTypeProps[]> => {
  if (!ids.length) {
    return [];
  }

  const response = await sdk.cma.contentType.getMany({
    query: {
      'sys.id[in]': ids.join(','),
      limit: ids.length,
    },
  });

  return response.items as ContentTypeProps[];
};

const getSlugFieldIdsByContentTypeId = async (
  sdk: HomeAppSDK | PageAppSDK,
  contentTypeIds: string[]
): Promise<SlugFieldIdsByContentTypeId> => {
  if (!contentTypeIds.length) {
    return new Map();
  }

  const editorInterfaces = await sdk.cma.editorInterface.getMany({
    query: {
      'sys.contentType.sys.id[in]': contentTypeIds.join(','),
      limit: contentTypeIds.length,
    },
  });

  const slugFieldIdsByContentTypeId: SlugFieldIdsByContentTypeId = new Map();

  editorInterfaces.items.forEach((editorInterface) => {
    const slugControl = editorInterface.controls?.find(
      (control) => control.widgetId === 'slugEditor'
    );
    if (slugControl?.fieldId) {
      slugFieldIdsByContentTypeId.set(editorInterface.sys.contentType.sys.id, slugControl.fieldId);
    }
  });

  return slugFieldIdsByContentTypeId;
};

const buildStructure = (
  items: EntryProps[],
  defaultLocale: string,
  referencedEntriesById: Map<string, EntryProps>,
  contentTypesById: Map<string, ContentTypeProps>,
  slugFieldIdsByContentTypeId: Map<string, string>
): EntryProps[] => {
  return items.map((item) => {
    const redirectFromField = item.fields.redirectFromContentTypes?.[defaultLocale];
    const redirectToField = item.fields.redirectToContentTypes?.[defaultLocale];

    const redirectFromEntry = redirectFromField
      ? referencedEntriesById.get(redirectFromField.sys.id)
      : undefined;
    const redirectToEntry = redirectToField
      ? referencedEntriesById.get(redirectToField.sys.id)
      : undefined;

    let redirectFromTitle = getDisplayFieldValue(
      contentTypesById,
      defaultLocale,
      redirectFromEntry
    );
    let redirectToTitle = getDisplayFieldValue(contentTypesById, defaultLocale, redirectToEntry);

    const redirectFromSlug = getSlugValue(
      defaultLocale,
      redirectFromEntry,
      slugFieldIdsByContentTypeId
    );
    const redirectToSlug = getSlugValue(
      defaultLocale,
      redirectToEntry,
      slugFieldIdsByContentTypeId
    );

    if (!redirectFromTitle || typeof redirectFromTitle !== 'string') {
      redirectFromTitle = 'Untitled';
    }

    if (!redirectToTitle || typeof redirectToTitle !== 'string') {
      redirectToTitle = 'Untitled';
    }

    return {
      ...item,
      fields: {
        ...item.fields,
        redirectFromContentTypes: {
          ...redirectFromField,
          title: redirectFromTitle,
          slug: redirectFromSlug,
        },
        redirectToContentTypes: {
          ...redirectToField,
          title: redirectToTitle,
          slug: redirectToSlug,
        },
      },
    };
  });
};

const getDisplayFieldValue = (
  contentTypesById: Map<string, ContentTypeProps>,
  defaultLocale: string,
  entry?: EntryProps
): string | undefined => {
  if (!entry) return undefined;

  const contentTypeId = entry.sys.contentType?.sys.id;
  if (!contentTypeId) return undefined;

  const contentType = contentTypesById.get(contentTypeId);
  const displayFieldId = contentType?.displayField;

  if (!displayFieldId) return undefined;

  const fields = entry.fields as Record<string, Record<string, unknown>>;
  const value = fields[displayFieldId]?.[defaultLocale];

  return typeof value === 'string' ? value : undefined;
};

const getSlugValue = (
  defaultLocale: string,
  entry: EntryProps | undefined,
  slugFieldIdsByContentTypeId: Map<string, string>
): string | undefined => {
  if (!entry) return undefined;

  const fields = entry.fields as Record<string, Record<string, unknown>>;
  const contentTypeId = entry.sys.contentType?.sys.id;

  if (contentTypeId) {
    const slugFieldIdFromAppearance = slugFieldIdsByContentTypeId.get(contentTypeId);

    if (slugFieldIdFromAppearance) {
      const valueFromAppearance = fields[slugFieldIdFromAppearance]?.[defaultLocale];

      if (typeof valueFromAppearance === 'string') {
        return valueFromAppearance;
      }
    }
  }

  const slug = fields.slug?.[defaultLocale];

  return typeof slug === 'string' ? slug : undefined;
};
