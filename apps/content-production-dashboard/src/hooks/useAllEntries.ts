import { useQuery } from '@tanstack/react-query';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { EntryProps, QueryOptions } from 'contentful-management';
import { fetchAllEntries, FetchAllEntriesResult } from '../utils/fetchAllEntries';
import { getEnvironmentId } from '../utils/sdkUtils';

export interface UseAllEntriesResult {
  entries: EntryProps[];
  total: number;
  isFetchingEntries: boolean;
  fetchingEntriesError: Error | null;
  fetchedAt: Date | undefined;
  refetchEntries: () => void;
}

export interface UseEntriesOptions {
  query?: QueryOptions;
  enabled?: boolean;
}

export function useEntries(options: UseEntriesOptions = {}): UseAllEntriesResult {
  const { query, enabled } = options;
  const sdk = useSDK<PageAppSDK>();

  const { data, isFetching, error, refetch } = useQuery<FetchAllEntriesResult, Error>({
    queryKey: ['entries', sdk.ids.space, getEnvironmentId(sdk), query ?? {}],
    queryFn: () => fetchAllEntries(sdk, query),
    enabled,
  });

  return {
    entries: data?.entries || [],
    total: data?.total || 0,
    isFetchingEntries: isFetching,
    fetchingEntriesError: error,
    fetchedAt: data?.fetchedAt,
    refetchEntries: () => {
      refetch();
    },
  };
}

export function useAllEntries(): UseAllEntriesResult {
  return useEntries();
}
