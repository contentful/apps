import { EntryProps } from 'contentful-management';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { REDIRECT_CONTENT_TYPE_ID } from './consts';

export interface FetchRedirectsResult {
  redirects: EntryProps[];
  total: number;
  fetchedAt: Date;
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

    const defaultLocaleValue = sdk.locales.default || 'en-US';

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
