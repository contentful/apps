import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EntryStatus } from '../../src/utils/types';
import { useScheduledContent } from '../../src/hooks/useScheduledContent';
import {
  createMockEntry,
  createMockScheduledAction,
  createMockContentType,
  createMockUser,
} from '../utils/testHelpers';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({
    ids: {
      space: 'test-space',
      environment: 'test-environment',
    },
  }),
}));

const mockRefetchScheduledActions = vi.fn();
const mockRefetchEntries = vi.fn();
const mockRefetchContentTypes = vi.fn();

const mockUseScheduledActions = vi.fn();
const mockUseEntries = vi.fn();
const mockUseContentTypes = vi.fn();
const mockUseUsers = vi.fn();

vi.mock('../../src/hooks/useScheduledActions', () => ({
  useScheduledActions: () => mockUseScheduledActions(),
}));

vi.mock('../../src/hooks/useAllEntries', () => ({
  useEntries: (options: any) => mockUseEntries(options),
}));

vi.mock('../../src/hooks/useContentTypes', () => ({
  useContentTypes: () => mockUseContentTypes(),
}));

vi.mock('../../src/hooks/useUsers', () => ({
  useUsers: (userIds: string[]) => mockUseUsers(userIds),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useScheduledContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetchScheduledActions.mockClear();
    mockRefetchEntries.mockClear();
    mockRefetchContentTypes.mockClear();
  });

  describe('Empty state', () => {
    it('returns empty items when no scheduled actions exist', () => {
      mockUseScheduledActions.mockReturnValue({
        scheduledActions: [],
        isFetchingScheduledActions: false,
        refetchScheduledActions: mockRefetchScheduledActions,
      });

      mockUseEntries.mockReturnValue({
        entries: [],
        isFetchingEntries: false,
        fetchingEntriesError: null,
        refetchEntries: mockRefetchEntries,
      });

      mockUseContentTypes.mockReturnValue({
        contentTypes: new Map(),
        isFetchingContentTypes: false,
        refetchContentTypes: mockRefetchContentTypes,
      });

      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useScheduledContent('en-US', 0), {
        wrapper: createWrapper(),
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Data fetching and mapping', () => {
    it('fetches and combines scheduled actions with entries', async () => {
      const entry1 = createMockEntry({
        id: 'entry-1',
        contentTypeId: 'blogPost',
        createdById: 'user-1',
      });
      const entry2 = createMockEntry({
        id: 'entry-2',
        contentTypeId: 'article',
        createdById: 'user-2',
      });

      const scheduledAction1 = createMockScheduledAction({
        id: 'action-1',
        entityId: 'entry-1',
        entityLinkType: 'Entry',
      });
      const scheduledAction2 = createMockScheduledAction({
        id: 'action-2',
        entityId: 'entry-2',
        entityLinkType: 'Entry',
      });

      const contentType1 = createMockContentType({ id: 'blogPost', name: 'Blog Post' });
      const contentType2 = createMockContentType({ id: 'article', name: 'Article' });

      const user1 = createMockUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' });
      const user2 = createMockUser({ id: 'user-2', firstName: 'Jane', lastName: 'Smith' });

      mockUseScheduledActions.mockReturnValue({
        scheduledActions: [scheduledAction1, scheduledAction2],
        isFetchingScheduledActions: false,
        refetchScheduledActions: mockRefetchScheduledActions,
      });

      mockUseEntries.mockReturnValue({
        entries: [entry1, entry2],
        isFetchingEntries: false,
        fetchingEntriesError: null,
        refetchEntries: mockRefetchEntries,
      });

      const contentTypesMap = new Map([
        ['blogPost', contentType1],
        ['article', contentType2],
      ]);
      mockUseContentTypes.mockReturnValue({
        contentTypes: contentTypesMap,
        isFetchingContentTypes: false,
        refetchContentTypes: mockRefetchContentTypes,
      });

      const usersMap = new Map([
        ['user-1', user1],
        ['user-2', user2],
      ]);
      mockUseUsers.mockReturnValue({
        usersMap,
        isFetching: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useScheduledContent('en-US', 0), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      expect(result.current.items[0]).toMatchObject({
        id: 'entry-1',
        contentType: 'Blog Post',
        contentTypeId: 'blogPost',
        scheduledActionId: 'action-1',
      });
      expect(result.current.items[1]).toMatchObject({
        id: 'entry-2',
        contentType: 'Article',
        contentTypeId: 'article',
        scheduledActionId: 'action-2',
      });
    });

    it('maps entries to ScheduledContentItem with correct data', async () => {
      const entry = createMockEntry({
        id: 'entry-1',
        contentTypeId: 'blogPost',
        createdById: 'user-1',
        publishedAt: '2024-01-01T00:00:00Z',
      });
      entry.sys.version = 3;
      entry.sys.publishedVersion = 1;

      const scheduledAction = createMockScheduledAction({
        id: 'action-1',
        entityId: 'entry-1',
        entityLinkType: 'Entry',
        scheduledFor: '2024-01-15T10:00:00Z',
      });

      const contentType = createMockContentType({ id: 'blogPost', name: 'Blog Post' });
      const user = createMockUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' });

      mockUseScheduledActions.mockReturnValue({
        scheduledActions: [scheduledAction],
        isFetchingScheduledActions: false,
        refetchScheduledActions: mockRefetchScheduledActions,
      });

      mockUseEntries.mockReturnValue({
        entries: [entry],
        isFetchingEntries: false,
        fetchingEntriesError: null,
        refetchEntries: mockRefetchEntries,
      });

      mockUseContentTypes.mockReturnValue({
        contentTypes: new Map([['blogPost', contentType]]),
        isFetchingContentTypes: false,
        refetchContentTypes: mockRefetchContentTypes,
      });

      mockUseUsers.mockReturnValue({
        usersMap: new Map([['user-1', user]]),
        isFetching: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useScheduledContent('en-US', 0), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      const item = result.current.items[0];
      expect(item.id).toBe('entry-1');
      expect(item.scheduledActionId).toBe('action-1');
      expect(item.scheduledFor).toBe('2024-01-15T10:00:00Z');
      expect(item.publishedDate).toBe('2024-01-01T00:00:00Z');
      expect(item.status).toBe(EntryStatus.Changed);
      expect(item.creator).toEqual({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
      });
    });
  });
});
