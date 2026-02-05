import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRecentlyPublishedContent } from '../../src/hooks/useRecentlyPublishedContent';
import { createMockEntry, createMockContentType, createMockUser } from '../utils/testHelpers';
import { createQueryProviderWrapper } from '../utils/createQueryProviderWrapper';
import { subDays } from '../../src/utils/dateUtils';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({
    ids: {
      space: 'test-space',
      environment: 'test-environment',
    },
  }),
}));

const mockRefetchContentTypes = vi.fn();
const mockRefetchUsers = vi.fn();

const mockUseContentTypes = vi.fn();
const mockUseUsers = vi.fn();

vi.mock('../../src/hooks/useContentTypes', () => ({
  useContentTypes: (contentTypeIds?: string[]) => mockUseContentTypes(contentTypeIds),
}));

vi.mock('../../src/hooks/useUsers', () => ({
  useUsers: (userIds: string[]) => mockUseUsers(userIds),
}));

describe('useRecentlyPublishedContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetchContentTypes.mockClear();
    mockRefetchUsers.mockClear();
  });

  describe('Empty state', () => {
    it('returns empty items when no entries exist', () => {
      mockUseContentTypes.mockReturnValue({
        contentTypes: new Map(),
        isFetchingContentTypes: false,
        refetchContentTypes: mockRefetchContentTypes,
        fetchingContentTypesError: null,
      });

      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: false,
        refetch: mockRefetchUsers,
        error: null,
      });

      const recentlyPublishedDate = subDays(new Date(), 7);

      const { result } = renderHook(
        () => useRecentlyPublishedContent(0, [], recentlyPublishedDate, 'en-US', new Map()),
        {
          wrapper: createQueryProviderWrapper(),
        }
      );

      expect(result.current.items).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Data fetching and mapping', () => {
    it('fetches and maps recently published entries', async () => {
      const recentlyPublishedDate = subDays(new Date(), 7);
      const publishedDate = subDays(new Date(), 3);

      const entry1 = createMockEntry({
        id: 'entry-1',
        contentTypeId: 'blogPost',
        createdById: 'user-1',
        publishedAt: publishedDate.toISOString(),
      });
      const entry2 = createMockEntry({
        id: 'entry-2',
        contentTypeId: 'article',
        createdById: 'user-2',
        publishedAt: publishedDate.toISOString(),
      });

      const contentType1 = createMockContentType({ id: 'blogPost', name: 'Blog Post' });
      const contentType2 = createMockContentType({ id: 'article', name: 'Article' });

      const user1 = createMockUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' });
      const user2 = createMockUser({ id: 'user-2', firstName: 'Jane', lastName: 'Smith' });

      const contentTypesMap = new Map([
        ['blogPost', contentType1],
        ['article', contentType2],
      ]);
      mockUseContentTypes.mockReturnValue({
        contentTypes: contentTypesMap,
        isFetchingContentTypes: false,
        refetchContentTypes: mockRefetchContentTypes,
        fetchingContentTypesError: null,
      });

      const usersMap = new Map([
        ['user-1', user1],
        ['user-2', user2],
      ]);
      mockUseUsers.mockReturnValue({
        usersMap,
        isFetching: false,
        refetch: mockRefetchUsers,
        error: null,
      });

      const { result } = renderHook(
        () =>
          useRecentlyPublishedContent(
            0,
            [entry1, entry2],
            recentlyPublishedDate,
            'en-US',
            contentTypesMap
          ),
        {
          wrapper: createQueryProviderWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      expect(result.current.items[0]).toMatchObject({
        id: 'entry-1',
        contentType: 'Blog Post',
        publishedDate: publishedDate.toISOString(),
      });
      expect(result.current.items[0].creator).toEqual({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result.current.items[1]).toMatchObject({
        id: 'entry-2',
        contentType: 'Article',
        publishedDate: publishedDate.toISOString(),
      });
      expect(result.current.items[1].creator).toEqual({
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
      });
    });

    it('filters entries by published date range and returns only entries in range', async () => {
      const recentlyPublishedDate = subDays(new Date(), 7);

      const entryInRange = createMockEntry({
        id: 'entry-1',
        contentTypeId: 'blogPost',
        createdById: 'user-1',
        publishedAt: subDays(new Date(), 3).toISOString(),
      });

      const entryOutOfRange = createMockEntry({
        id: 'entry-2',
        contentTypeId: 'article',
        createdById: 'user-2',
        publishedAt: subDays(new Date(), 10).toISOString(),
      });

      const entryNoPublished = createMockEntry({
        id: 'entry-3',
        contentTypeId: 'article',
        createdById: 'user-3',
      });
      entryNoPublished.sys.publishedAt = undefined;

      const contentType = createMockContentType({ id: 'blogPost', name: 'Blog Post' });
      const user = createMockUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' });

      mockUseContentTypes.mockReturnValue({
        contentTypes: new Map([['blogPost', contentType]]),
        isFetchingContentTypes: false,
        refetchContentTypes: mockRefetchContentTypes,
        fetchingContentTypesError: null,
      });

      mockUseUsers.mockReturnValue({
        usersMap: new Map([['user-1', user]]),
        isFetching: false,
        refetch: mockRefetchUsers,
        error: null,
      });

      const { result } = renderHook(
        () =>
          useRecentlyPublishedContent(
            0,
            [entryInRange, entryOutOfRange, entryNoPublished],
            recentlyPublishedDate,
            'en-US',
            new Map([['blogPost', contentType]])
          ),
        {
          wrapper: createQueryProviderWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      const item = result.current.items[0];
      expect(item.id).toBe('entry-1');
      expect(item.contentType).toBe('Blog Post');
      expect(item.publishedDate).toBe(entryInRange.sys.publishedAt);
      expect(item.creator).toEqual({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.current.total).toBe(1);
    });
  });
});
