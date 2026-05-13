import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { EntryProps } from 'contentful-management';
import { fetchEntryTitlesForIds } from '../utils/fetchEntryTitlesForIds';
import { getEnvironmentId } from '../utils/sdkUtils';

interface UseEntryTitlesForIdsResult {
  titlesMap: Map<string, EntryProps>;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

// Lazy-fetches full entries for a set of ids (typically the 5 visible
// rows of a table) so titles can be resolved against `entry.fields`.
// Callers must sort their visible page on `sys.*` data only -- this
// design assumes the bulk fetch is sys-only and would break for any
// table that sorts on a `field` value.
export function useEntryTitlesForIds(ids: string[]): UseEntryTitlesForIdsResult {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();

  const { data, isFetching, error, refetch } = useQuery<EntryProps[], Error>({
    queryKey: ['entryTitles', sdk.ids.space, getEnvironmentId(sdk), [...ids].sort().join(',')],
    enabled: ids.length > 0,
    queryFn: () => fetchEntryTitlesForIds(sdk, ids),
  });

  const titlesMap = useMemo(() => {
    const map = new Map<string, EntryProps>();
    (data ?? []).forEach((entry) => {
      map.set(entry.sys.id, entry);
    });
    return map;
  }, [data]);

  return {
    titlesMap,
    isFetching,
    error: error ?? null,
    refetch,
  };
}
