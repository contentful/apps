import { useQuery } from '@tanstack/react-query';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { EntryProps } from 'contentful-management';
import { fetchAllEntries, FetchAllEntriesResult } from '../utils/entryFetcher';

export interface UseAllEntriesResult {
  entries: EntryProps[];
  total: number;
  isFetching: boolean;
  error: Error | null;
  fetchedAt: Date | undefined;
}

export function useAllEntries(): UseAllEntriesResult {
  const sdk = useSDK<PageAppSDK>();

  const { data, isFetching, error } = useQuery<FetchAllEntriesResult, Error>({
    queryKey: ['entries', sdk.ids.space, sdk.ids.environment],
    queryFn: () => fetchAllEntries(sdk),
  });

  return {
    entries: data?.entries || [],
    total: data?.total || 0,
    isFetching,
    error,
    fetchedAt: data?.fetchedAt,
  };
}
