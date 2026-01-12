import { useQuery } from '@tanstack/react-query';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { EntryProps } from 'contentful-management';
import { fetchAllEntries, FetchAllEntriesResult } from '../utils/fetchAllEntries';

export interface UseAllEntriesResult {
  entries: EntryProps[];
  total: number;
  isFetchingEntries: boolean;
  fetchingEntriesError: Error | null;
  fetchedAt: Date | undefined;
  refetchEntries: () => void;
}

export function useAllEntries(): UseAllEntriesResult {
  const sdk = useSDK<PageAppSDK>();

  const { data, isFetching, error, refetch } = useQuery<FetchAllEntriesResult, Error>({
    queryKey: ['entries', sdk.ids.space, sdk.ids.environment],
    queryFn: () => fetchAllEntries(sdk),
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
