import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { ScheduledActionProps, UserProps } from 'contentful-management';
import { fetchReleases } from '../../src/utils/fetchReleases';
import { mockCma } from '../mocks/mockCma';

describe('fetchReleases', () => {
  let mockSdk: HomeAppSDK | PageAppSDK;
  const spaceId = 'test-space';
  const environmentId = 'test-environment';

  const setupMocks = (config: {
    scheduledActions?: ScheduledActionProps[];
    launchReleases?: any[];
    timelineReleases?: any[];
    users?: UserProps[];
  }) => {
    const {
      scheduledActions = [],
      launchReleases = [],
      timelineReleases = [],
      users = [],
    } = config;

    mockCma.scheduledActions.getMany.mockResolvedValueOnce({
      items: scheduledActions,
      total: scheduledActions.length,
    });

    mockCma.release.query
      .mockResolvedValueOnce({ items: launchReleases, total: launchReleases.length })
      .mockResolvedValueOnce({ items: timelineReleases, total: timelineReleases.length });

    const userIds = [
      ...new Set(
        scheduledActions
          .map((a) => a.sys.createdBy?.sys.id ?? null)
          .filter((id): id is string => id !== null)
      ),
    ];
    if (userIds.length > 0) {
      mockCma.user.getManyForSpace.mockResolvedValueOnce({
        items: users,
        total: users.length,
      });
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = {
      ids: {
        space: spaceId,
        environment: environmentId,
      },
      cma: mockCma,
    } as any;

    mockCma.scheduledActions = {
      getMany: vi.fn(),
    };
    mockCma.release = {
      query: vi.fn(),
    };
    mockCma.user = {
      getManyForSpace: vi.fn(),
    };
  });

  describe('Empty state', () => {
    it('returns empty result when no scheduled actions exist', async () => {
      setupMocks({ scheduledActions: [] });

      const result = await fetchReleases(mockSdk);

      expect(result.releases).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.fetchedAt).toBeInstanceOf(Date);
      expect(mockCma.scheduledActions.getMany).toHaveBeenCalledTimes(1);
      expect(mockCma.release.query).not.toHaveBeenCalled();
      expect(mockCma.user.getManyForSpace).not.toHaveBeenCalled();
    });
  });

  describe('Release fetching', () => {
    it('fetches and returns launch releases with scheduled actions', async () => {
      const action = createActionWithRelease('action-1', 'launch-release-1');
      const release = createMockRelease('launch', {
        id: 'launch-release-1',
        title: 'My Launch Release',
        itemsCount: 10,
      });
      const user = createMockUser({ sys: { id: 'user-1' } as any });

      setupMocks({
        scheduledActions: [action],
        launchReleases: [release],
        users: [user],
      });

      const result = await fetchReleases(mockSdk);

      expect(result.releases).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.releases[0]).toMatchObject({
        releaseId: 'launch-release-1',
        scheduledActionId: 'action-1',
        title: 'My Launch Release',
        action: 'publish',
        itemsCount: 10,
        viewUrl: `https://launch.contentful.com/spaces/${spaceId}/releases/launch-release-1`,
        updatedBy: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
        },
      });
      expect(result.fetchedAt).toBeInstanceOf(Date);
    });

    it('fetches and returns timeline releases with scheduled actions', async () => {
      const action = createActionWithRelease('action-1', 'timeline-release-1');
      const release = createMockRelease('timeline', {
        id: 'timeline-release-1',
        title: 'My Timeline Release',
        itemsCount: 15,
      });
      const user = createMockUser();

      setupMocks({
        scheduledActions: [action],
        timelineReleases: [release],
        users: [user],
      });

      const result = await fetchReleases(mockSdk);

      expect(result.releases).toHaveLength(1);
      expect(result.releases[0]).toMatchObject({
        releaseId: 'timeline-release-1',
        title: 'My Timeline Release',
        itemsCount: 15,
        viewUrl: `https://app.contentful.com/spaces/${spaceId}/views/entries?release=timeline-release-1`,
      });
    });
  });

  describe('Mixed release types', () => {
    it('handles both launch and timeline releases correctly', async () => {
      const launchAction = createActionWithRelease('action-1', 'launch-release-1');
      const timelineAction = createActionWithRelease('action-2', 'timeline-release-1');
      const launchRelease = createMockRelease('launch', {
        id: 'launch-release-1',
        title: 'Launch Release',
      });
      const timelineRelease = createMockRelease('timeline', {
        id: 'timeline-release-1',
        title: 'Timeline Release',
      });
      const user = createMockUser();

      setupMocks({
        scheduledActions: [launchAction, timelineAction],
        launchReleases: [launchRelease],
        timelineReleases: [timelineRelease],
        users: [user],
      });

      const result = await fetchReleases(mockSdk);

      expect(result.releases).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.releases[0].viewUrl).toContain('launch.contentful.com');
      expect(result.releases[1].viewUrl).toContain('app.contentful.com');
    });
  });
});

const createMockScheduledAction = (
  overrides?: Partial<ScheduledActionProps>
): ScheduledActionProps => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const defaultAction: ScheduledActionProps = {
    sys: {
      id: 'action-1',
      type: 'ScheduledAction',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      space: { sys: { id: 'space-1', type: 'Link', linkType: 'Space' } },
      status: 'scheduled',
      createdBy: {
        sys: {
          id: 'user-1',
          type: 'Link',
          linkType: 'User',
        },
      },
      updatedBy: {
        sys: {
          id: 'user-1',
          type: 'Link',
          linkType: 'User',
        },
      },
    },
    entity: {
      sys: {
        id: 'release-1',
        type: 'Link',
        linkType: 'Release',
      },
    },
    scheduledFor: {
      datetime: futureDate.toISOString(),
      timezone: 'UTC',
    },
    action: 'publish',
  } as ScheduledActionProps;

  if (overrides?.sys) {
    defaultAction.sys = { ...defaultAction.sys, ...(overrides.sys as any) };
    if ((overrides.sys as any).createdBy) {
      defaultAction.sys.createdBy = (overrides.sys as any).createdBy;
    }
  }

  return { ...defaultAction, ...overrides, sys: defaultAction.sys } as ScheduledActionProps;
};

const createMockRelease = (
  type: 'launch' | 'timeline',
  overrides?: { id?: string; title?: string; itemsCount?: number }
) => {
  const baseRelease = {
    sys: {
      id: overrides?.id || 'release-1',
      type: 'Release',
      status: 'active',
      updatedAt: new Date().toISOString(),
      ...(type === 'timeline' && { schemaVersion: 'Release.v2' }),
    },
    title: overrides?.title || `Test ${type} Release`,
    entities: {
      items: Array.from({ length: overrides?.itemsCount || 5 }, (_, i) => ({
        sys: { id: `item-${i}` },
      })),
    },
  };
  return baseRelease;
};

const createMockUser = (overrides?: Partial<UserProps>): UserProps => {
  return {
    sys: {
      id: 'user-1',
      type: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    ...overrides,
  } as UserProps;
};

const createActionWithRelease = (actionId: string, releaseId: string, userId = 'user-1') =>
  createMockScheduledAction({
    sys: {
      id: actionId,
      createdBy: {
        sys: {
          id: userId,
          type: 'Link',
          linkType: 'User',
        },
      },
    } as any,
    entity: {
      sys: {
        id: releaseId,
        type: 'Link',
        linkType: 'Release',
      },
    },
  });
