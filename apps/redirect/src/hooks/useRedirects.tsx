import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchRedirects, FetchRedirectsResult } from '../utils/fetchRedirects';
import { ITEMS_PER_PAGE } from '../utils/consts';
import { RedirectEntry } from '../utils/types';

export interface UseRedirectsResult {
  redirects: RedirectEntry[];
  allRedirects: RedirectEntry[];
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

  const [allData, setAllData] = useState<FetchRedirectsResult | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const result = await fetchRedirects(sdk);
      setAllData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsFetching(false);
    }
  }, [sdk]);

  useEffect(() => {
    load();
  }, [load]);

  const paginatedRedirects = useMemo<RedirectEntry[]>(
    () => (allData ? allData.redirects.slice(skip, skip + itemsPerPage) : []),
    [allData, skip, itemsPerPage]
  );

  return {
    redirects: paginatedRedirects,
    allRedirects: allData?.redirects ?? [],
    total: allData?.total ?? 0,
    isFetchingRedirects: isFetching,
    fetchingRedirectsError: error,
    refetchRedirects: load,
    fetchedAt: allData?.fetchedAt,
  };
}
