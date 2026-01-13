import { BaseAppSDK, HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { UserProps } from 'contentful-management';
import { fetchScheduledActions } from './fetchScheduledActions';

export interface ReleaseWithScheduledAction {
  releaseId: string;
  scheduledActionId: string;
  title: string;
  scheduledFor: {
    datetime: string;
    timezone?: string;
  };
  action: 'publish' | 'unpublish';
  itemsCount: number;
  updatedAt: string;
  updatedBy: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
  viewUrl: string;
}

export interface FetchReleasesResult {
  releases: ReleaseWithScheduledAction[];
  total: number;
  fetchedAt: Date;
}

interface ReleaseInfo {
  title: string;
  itemsCount: number;
  viewUrl: string;
}

const fetchLaunchReleases = async (sdk: BaseAppSDK): Promise<Map<string, ReleaseInfo>> => {
  const releasesMap = new Map<string, { title: string; itemsCount: number; viewUrl: string }>();
  const launchReleasesResponse = await sdk.cma.release.query({
    query: {
      'sys.status[in]': 'active',
      limit: 500,
      order: '-sys.updatedAt',
    },
  });

  launchReleasesResponse.items.forEach((release) => {
    releasesMap.set(release.sys.id, {
      title: release.title,
      itemsCount: release.entities?.items?.length || 0,
      viewUrl: `https://launch.contentful.com/spaces/${sdk.ids.space}/releases/${release.sys.id}`,
    });
  });

  return releasesMap;
};

const fetchTimelineReleases = async (
  sdk: HomeAppSDK | PageAppSDK
): Promise<Map<string, ReleaseInfo>> => {
  const releasesMap = new Map<string, { title: string; itemsCount: number; viewUrl: string }>();
  const timelineReleasesResponse = await sdk.cma.release.query({
    query: {
      'sys.schemaVersion': 'Release.v2',
      'sys.status[in]': 'active',
      limit: 500,
      order: '-sys.updatedAt',
    },
  });

  timelineReleasesResponse.items.forEach((release) => {
    releasesMap.set(release.sys.id, {
      title: release.title,
      itemsCount: release.entities?.items?.length || 0,
      viewUrl: `https://app.contentful.com/spaces/${sdk.ids.space}/views/entries?release=${release.sys.id}`,
    });
  });

  return releasesMap;
};

export const fetchReleases = async (sdk: BaseAppSDK): Promise<FetchReleasesResult> => {
  const scheduledActions = await fetchScheduledActions(sdk, {
    'sys.status[in]': 'scheduled',
    'entity.sys.linkType': 'Release',
  });

  if (scheduledActions.total === 0) {
    return {
      releases: [],
      total: 0,
      fetchedAt: new Date(),
    };
  }

  const userIds = [
    ...new Set(scheduledActions.items.map((a) => a.sys.createdBy.sys.id ?? null).filter(Boolean)),
  ];

  const [launchReleasesResponse, timelineReleasesResponse, usersResponse] = await Promise.all([
    fetchLaunchReleases(sdk),
    fetchTimelineReleases(sdk),
    userIds.length > 0
      ? sdk.cma.user.getManyForSpace({
          spaceId: sdk.ids.space,
          query: { 'sys.id[in]': userIds.join(',') },
        })
      : Promise.resolve({ items: [] }),
  ]);

  // Build maps for quick lookup
  const usersMap = new Map<string, UserProps>();
  usersResponse.items.forEach((user) => {
    usersMap.set(user.sys.id, user);
  });

  const releasesMap = new Map<string, ReleaseInfo>([
    ...launchReleasesResponse.entries(),
    ...timelineReleasesResponse.entries(),
  ]);

  const releasesWithActions: ReleaseWithScheduledAction[] = scheduledActions.items
    .filter((action) => {
      const releaseId = action.entity.sys.id;
      return releaseId && releasesMap.has(releaseId);
    })
    .map((action) => {
      const releaseId = action.entity.sys.id!;
      const releaseInfo = releasesMap.get(releaseId)!;
      const userId = action.sys.createdBy.sys.id ?? null;
      const user = userId ? usersMap.get(userId) : undefined;

      return {
        releaseId,
        scheduledActionId: action.sys.id,
        title: releaseInfo.title,
        scheduledFor: action.scheduledFor,
        action: action.action,
        itemsCount: releaseInfo.itemsCount,
        updatedAt: action.sys.updatedAt,
        updatedBy: userId
          ? {
              id: userId,
              firstName: user?.firstName,
              lastName: user?.lastName,
            }
          : null,
        viewUrl: releaseInfo.viewUrl,
      };
    });

  return {
    releases: releasesWithActions,
    total: releasesWithActions.length,
    fetchedAt: new Date(),
  };
};
