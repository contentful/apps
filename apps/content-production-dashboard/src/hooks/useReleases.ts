import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useQuery } from '@tanstack/react-query';

import { RELEASES_PER_PAGE } from '../utils/consts';
import {
  ReleaseWithScheduledAction,
  FetchReleasesResult,
  fetchReleases,
} from '../utils/fetchReleases';
import { getEnvironmentId } from '../utils/sdkUtils';

export interface UseReleasesResult {
  releases: ReleaseWithScheduledAction[];
  total: number;
  isFetchingReleases: boolean;
  fetchingReleasesError: Error | null;
  refetchReleases: () => void;
  fetchedAt: Date | undefined;
}

export function useReleases(page: number = 0): UseReleasesResult {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const skip = page * RELEASES_PER_PAGE;

  const { data, isFetching, error, refetch } = useQuery<FetchReleasesResult, Error>({
    queryKey: ['releases', sdk.ids.space, getEnvironmentId(sdk)],
    queryFn: () => fetchReleases(sdk),
    select: (data) => {
      const paginatedReleases = data.releases.slice(skip, skip + RELEASES_PER_PAGE);
      return {
        releases: paginatedReleases,
        total: data.total,
        fetchedAt: data.fetchedAt,
      };
    },
  });

  return {
    releases: data?.releases || [],
    total: data?.total || 0,
    isFetchingReleases: isFetching,
    fetchingReleasesError: error,
    refetchReleases: refetch,
    fetchedAt: data?.fetchedAt,
  };
}
