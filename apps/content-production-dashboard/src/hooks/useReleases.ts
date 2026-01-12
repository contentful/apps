import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useQuery } from '@tanstack/react-query';

import { RELEASES_PER_PAGE } from '../utils/consts';
import {
  ReleaseWithScheduledAction,
  FetchReleasesResult,
  fetchReleases,
} from '../utils/fetchReleases';

export interface UseReleasesResult {
  releases: ReleaseWithScheduledAction[];
  total: number;
  isFetchingReleases: boolean;
  fetchingReleasesError: Error | null;
  refetch: () => void;
  fetchedAt: Date | undefined;
}

export function useReleases(page: number = 1): UseReleasesResult {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const skip = page * RELEASES_PER_PAGE;

  const { data, isFetching, error, refetch } = useQuery<FetchReleasesResult, Error>({
    queryKey: ['releases', sdk.ids.space, sdk.ids.environment, page],
    queryFn: () => fetchReleases(sdk, skip, RELEASES_PER_PAGE),
  });

  return {
    releases: data?.releases || [],
    total: data?.total || 0,
    isFetchingReleases: isFetching,
    fetchingReleasesError: error,
    refetch,
    fetchedAt: data?.fetchedAt,
  };
}
