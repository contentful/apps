import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNeedsUpdate } from '../../src/hooks/useNeedsUpdateContent';
import { createMockEntry, createMockContentType, createMockUser } from '../utils/testHelpers';
import { createQueryProviderWrapper } from '../utils/createQueryProviderWrapper';
import { subMonths } from '../../src/utils/dateCalculator';

const mockUseSDK = vi.fn();

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockUseSDK(),
}));

const mockRefetchUsers = vi.fn();

const mockUseUsers = vi.fn();

vi.mock('../../src/hooks/useUsers', () => ({
  useUsers: (userIds: string[]) => mockUseUsers(userIds),
}));

describe('useNeedsUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetchUsers.mockClear();
    mockUseSDK.mockReturnValue({
      ids: {
        space: 'test-space',
        environment: 'test-environment',
      },
      locales: {
        default: 'en-US',
      },
      parameters: {
        installation: {
          needsUpdateMonths: 6,
        },
      },
    });
  });

  describe('Empty state', () => {
    it('returns empty items when no entries exist', () => {
      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: false,
        refetch: mockRefetchUsers,
        error: null,
      });

      const { result } = renderHook(() => useNeedsUpdate([], 0, new Map()), {
        wrapper: createQueryProviderWrapper(),
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('returns empty items when all entries are recent', () => {
      const recentEntry = createMockEntry({
        id: 'entry-1',
        contentTypeId: 'blogPost',
        createdById: 'user-1',
        updatedAt: new Date().toISOString(),
      });

      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: false,
        refetch: mockRefetchUsers,
        error: null,
      });

      const { result } = renderHook(() => useNeedsUpdate([recentEntry], 0, new Map()), {
        wrapper: createQueryProviderWrapper(),
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.total).toBe(0);
    });
  });

  describe('Data filtering and mapping', () => {
    it('filters entries older than threshold and maps them correctly', async () => {
      const thresholdDate = subMonths(new Date(), 6);
      const oldUpdatedAt = new Date(thresholdDate);
      oldUpdatedAt.setDate(oldUpdatedAt.getDate() - 1);

      const oldEntry = createMockEntry({
        id: 'entry-1',
        contentTypeId: 'blogPost',
        createdById: 'user-1',
        updatedAt: oldUpdatedAt.toISOString(),
        publishedAt: '2024-01-01T00:00:00Z',
      });

      const recentEntry = createMockEntry({
        id: 'entry-2',
        contentTypeId: 'article',
        createdById: 'user-2',
        updatedAt: new Date().toISOString(),
      });

      const contentType = createMockContentType({ id: 'blogPost', name: 'Blog Post' });
      const user = createMockUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' });

      const contentTypesMap = new Map([['blogPost', contentType]]);
      mockUseUsers.mockReturnValue({
        usersMap: new Map([['user-1', user]]),
        isFetching: false,
        refetch: mockRefetchUsers,
        error: null,
      });

      const { result } = renderHook(
        () => useNeedsUpdate([oldEntry, recentEntry], 0, contentTypesMap),
        {
          wrapper: createQueryProviderWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      expect(result.current.items[0]).toMatchObject({
        id: 'entry-1',
        contentType: 'Blog Post',
        publishedDate: '2024-01-01T00:00:00Z',
      });
      expect(result.current.items[0].creator).toEqual({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.current.items[0].age).toBeGreaterThan(0);
      expect(result.current.total).toBe(1);
    });

    it('sorts entries by age in descending order (oldest first)', async () => {
      const thresholdDate = subMonths(new Date(), 6);
      const veryOldDate = new Date(thresholdDate);
      veryOldDate.setDate(veryOldDate.getDate() - 100);
      const oldDate = new Date(thresholdDate);
      oldDate.setDate(oldDate.getDate() - 50);

      const entry1 = createMockEntry({
        id: 'entry-1',
        contentTypeId: 'blogPost',
        createdById: 'user-1',
        updatedAt: oldDate.toISOString(),
      });

      const entry2 = createMockEntry({
        id: 'entry-2',
        contentTypeId: 'article',
        createdById: 'user-2',
        updatedAt: veryOldDate.toISOString(),
      });

      const contentType1 = createMockContentType({ id: 'blogPost', name: 'Blog Post' });
      const contentType2 = createMockContentType({ id: 'article', name: 'Article' });

      const contentTypesMap = new Map([
        ['blogPost', contentType1],
        ['article', contentType2],
      ]);

      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: false,
        refetch: mockRefetchUsers,
        error: null,
      });

      const { result } = renderHook(() => useNeedsUpdate([entry1, entry2], 0, contentTypesMap), {
        wrapper: createQueryProviderWrapper(),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      // Entry 2 should be first because it's older (has higher age)
      expect(result.current.items[0].id).toBe('entry-2');
      expect(result.current.items[1].id).toBe('entry-1');
      expect(result.current.items[0].age).toBeGreaterThan(result.current.items[1].age);
    });
  });

  describe('Pagination', () => {
    it('returns correct page of items', async () => {
      const thresholdDate = subMonths(new Date(), 6);
      const oldDate = new Date(thresholdDate);
      oldDate.setDate(oldDate.getDate() - 1);

      const entries = Array.from({ length: 12 }, (_, i) =>
        createMockEntry({
          id: `entry-${i + 1}`,
          contentTypeId: 'blogPost',
          updatedAt: oldDate.toISOString(),
        })
      );

      const contentType = createMockContentType({ id: 'blogPost', name: 'Blog Post' });

      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: false,
        refetch: mockRefetchUsers,
        error: null,
      });

      const { result: resultPage0 } = renderHook(
        () => useNeedsUpdate(entries, 0, new Map([['blogPost', contentType]])),
        {
          wrapper: createQueryProviderWrapper(),
        }
      );

      await waitFor(() => {
        expect(resultPage0.current.items).toHaveLength(5);
      });

      expect(resultPage0.current.total).toBe(12);

      const { result: resultPage1 } = renderHook(
        () => useNeedsUpdate(entries, 1, new Map([['blogPost', contentType]])),
        {
          wrapper: createQueryProviderWrapper(),
        }
      );

      await waitFor(() => {
        expect(resultPage1.current.items).toHaveLength(5);
      });

      expect(resultPage1.current.total).toBe(12);
      expect(resultPage1.current.items[0].id).not.toBe(resultPage0.current.items[0].id);
    });
  });

  describe('Error handling', () => {
    it('returns error when useUsers fails', () => {
      const thresholdDate = subMonths(new Date(), 6);
      const oldDate = new Date(thresholdDate);
      oldDate.setDate(oldDate.getDate() - 1);

      const entry = createMockEntry({
        id: 'entry-1',
        contentTypeId: 'blogPost',
        createdById: 'user-1',
        updatedAt: oldDate.toISOString(),
      });

      const error = new Error('Failed to fetch users');
      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: false,
        refetch: mockRefetchUsers,
        error,
      });

      const { result } = renderHook(() => useNeedsUpdate([entry], 0, new Map()), {
        wrapper: createQueryProviderWrapper(),
      });

      expect(result.current.error).toBe(error);
    });

    it('calls refetch when refetch is called', () => {
      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: false,
        refetch: mockRefetchUsers,
        error: null,
      });

      const { result } = renderHook(() => useNeedsUpdate([], 0, new Map()), {
        wrapper: createQueryProviderWrapper(),
      });

      result.current.refetch();
      expect(mockRefetchUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading state', () => {
    it('returns isFetching true when users are being fetched', () => {
      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: true,
        refetch: mockRefetchUsers,
        error: null,
      });

      const { result } = renderHook(() => useNeedsUpdate([], 0, new Map()), {
        wrapper: createQueryProviderWrapper(),
      });

      expect(result.current.isFetching).toBe(true);
    });
  });

  describe('Custom needsUpdateMonths parameter', () => {
    it('uses custom needsUpdateMonths from installation parameters', async () => {
      mockUseSDK.mockReturnValue({
        ids: {
          space: 'test-space',
          environment: 'test-environment',
        },
        locales: {
          default: 'en-US',
        },
        parameters: {
          installation: {
            needsUpdateMonths: 12,
          },
        },
      });

      const thresholdDate = subMonths(new Date(), 12);
      const oldDate = new Date(thresholdDate);
      oldDate.setDate(oldDate.getDate() - 1);

      const entry = createMockEntry({
        id: 'entry-1',
        contentTypeId: 'blogPost',
        updatedAt: oldDate.toISOString(),
      });

      const contentType = createMockContentType({ id: 'blogPost', name: 'Blog Post' });

      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: false,
        refetch: mockRefetchUsers,
        error: null,
      });

      const { result } = renderHook(
        () => useNeedsUpdate([entry], 0, new Map([['blogPost', contentType]])),
        {
          wrapper: createQueryProviderWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      expect(result.current.total).toBe(1);
    });
  });
});
