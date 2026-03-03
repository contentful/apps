import { EntryProps, QueryOptions } from 'contentful-management';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { REDIRECT_CONTENT_TYPE_ID } from './consts';

export interface FetchRedirectsResult {
  redirects: EntryProps[];
  total: number;
  fetchedAt: Date;
}

export interface FetchRedirectsParams {
  searchQuery?: string;
  typeFilter?: string[];
  statusFilter?: string[];
  limit?: number;
  skip?: number;
}

export const fetchRedirects = async (
  sdk: HomeAppSDK | PageAppSDK,
  { searchQuery = '', typeFilter = [], statusFilter = [], limit, skip }: FetchRedirectsParams = {}
): Promise<FetchRedirectsResult> => {
  try {
    const defaultLocaleValue = sdk.locales.default || 'en-US';

    const query: QueryOptions & Record<string, unknown> = {
      limit: limit ?? 100,
      skip: skip ?? 0,
      content_type: REDIRECT_CONTENT_TYPE_ID,
      locale: defaultLocaleValue,
    };

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      query.query = trimmedQuery;
    }

    if (typeFilter.length === 1) {
      query['fields.redirectType'] = typeFilter[0];
    }

    if (statusFilter.length === 1) {
      query['fields.active'] = statusFilter[0] === 'Active' ? true : false;
    }
    // If both 'active' and 'inactive' or Temporary (302) and Permanent (301) are selected we intentionally do not
    // add any status filter so that all redirects are returned.

    const response = await sdk.cma.entry.getMany({
      query,
    });

    const redirects = await Promise.all(
      response.items.map(async (item) => {
        const redirectFromEntry = await sdk.cma.entry.get({
          entryId: item.fields.redirectFromContentTypes[defaultLocaleValue].sys.id,
        });

        const redirectToEntry = await sdk.cma.entry.get({
          entryId: item.fields.redirectToContentTypes[defaultLocaleValue].sys.id,
        });

        let redirectFromTitle = redirectFromEntry.fields.title?.[defaultLocaleValue];
        let redirectToTitle = redirectToEntry.fields.title?.[defaultLocaleValue];

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
              ...item.fields.redirectFromContentTypes[defaultLocaleValue],
              title: redirectFromTitle,
            },
            redirectToContentTypes: {
              ...item.fields.redirectToContentTypes[defaultLocaleValue],
              title: redirectToTitle,
            },
          },
        };
      })
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
