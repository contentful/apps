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
  const response = await sdk.cma.entry.getMany({
    query: {
      limit: 100,
      skip: 0,
      content_type: REDIRECT_CONTENT_TYPE_ID,
    },
  });

  return {
    redirects: response.items,
    total: response.total,
    fetchedAt: new Date(),
  };
};
