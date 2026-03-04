import { BaseAppSDK, HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useQuery } from '@tanstack/react-query';
import { fetchRedirects, FetchRedirectsResult } from '../utils/fetchRedirects';
import { ITEMS_PER_PAGE } from '../utils/consts';
import { EntryProps } from 'contentful-management';

export interface UseRedirectsResult {
  redirects: EntryProps[];
  total: number;
  isFetchingRedirects: boolean;
  fetchingRedirectsError: Error | null;
  refetchRedirects: () => void;
  fetchedAt: Date | undefined;
}

export function useRedirects(
  page: number = 0,
  itemsPerPage: number = ITEMS_PER_PAGE
): UseRedirectsResult {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const skip = page * itemsPerPage;

  const { data, isFetching, error, refetch } = useQuery<FetchRedirectsResult, Error>({
    queryKey: ['redirects', sdk.ids.space, sdk.ids.environmentAlias ?? sdk.ids.environment],
    queryFn: () => fetchRedirects(sdk),
    select: (data: FetchRedirectsResult) => {
      const paginatedRedirects = data.redirects.slice(skip, skip + itemsPerPage);
      return {
        redirects: paginatedRedirects,
        total: data.total,
        fetchedAt: data.fetchedAt,
      };
    },
  });

  return {
    redirects: data?.redirects || [],
    total: data?.total || 0,
    isFetchingRedirects: isFetching,
    fetchingRedirectsError: error,
    refetchRedirects: refetch,
    fetchedAt: data?.fetchedAt,
  };
}
