import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ScheduledContentTable } from '../../src/components/ScheduledContentTable';
import { EntryStatus } from '../../src/utils/types';
import { mockSdk } from '../mocks';
import { createQueryProviderWrapper } from '../utils/createQueryProviderWrapper';
import {
  createMockEntry,
  createMockScheduledAction,
  createMockScheduledContentItem,
  createMockContentType,
} from '../utils/testHelpers';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => ({}),
}));

const mockRefetch = vi.fn();
const mockUseScheduledContent = vi.fn();

vi.mock('../../src/hooks/useScheduledContent', () => ({
  useScheduledContent: (
    scheduledActions: unknown[],
    entries: unknown[],
    defaultLocale: string,
    page: number,
    contentTypes: unknown
  ) => mockUseScheduledContent(scheduledActions, entries, defaultLocale, page, contentTypes),
}));

describe('ScheduledContentTable component', () => {
  const mockContentTypes = new Map([
    ['blogPost', createMockContentType({ id: 'blogPost', name: 'Blog Post' })],
    ['article', createMockContentType({ id: 'article', name: 'Article' })],
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockClear();
    mockSdk.locales = { default: 'en-US' };
    mockSdk.ids.space = 'test-space';
  });

  afterEach(() => {
    cleanup();
  });

  describe('Table rendering', () => {
    it('renders table with correct columns', () => {
      const entry = createMockEntry({ id: 'entry-1', contentTypeId: 'blogPost' });
      const scheduledAction = createMockScheduledAction({
        id: 'action-1',
        entityId: 'entry-1',
        entityLinkType: 'Entry',
      });
      const mockItem = createMockScheduledContentItem();
      mockUseScheduledContent.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <ScheduledContentTable
          scheduledActions={[scheduledAction]}
          entries={[entry]}
          contentTypes={mockContentTypes}
        />,
        {
          wrapper: createQueryProviderWrapper(),
        }
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Scheduled Date')).toBeInTheDocument();
      expect(screen.getByText('Published Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Content Type')).toBeInTheDocument();
      expect(screen.getByText('Creator')).toBeInTheDocument();
    });

    it('renders scheduled content items with correct data', () => {
      const publishedDate = '2024-01-01T12:00:00Z';
      const entry = createMockEntry({
        id: 'entry-1',
        contentTypeId: 'blogPost',
        publishedAt: publishedDate,
      });
      const scheduledAction = createMockScheduledAction({
        id: 'action-1',
        entityId: 'entry-1',
        entityLinkType: 'Entry',
        scheduledFor: '2024-01-15T10:00:00Z',
      });
      const mockItem = createMockScheduledContentItem({
        id: 'entry-1',
        title: 'My Blog Post',
        contentType: 'Blog Post',
        scheduledFor: {
          datetime: '2024-01-15T10:00:00Z',
          timezone: 'UTC',
        },
        publishedDate,
      });

      mockUseScheduledContent.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <ScheduledContentTable
          scheduledActions={[scheduledAction]}
          entries={[entry]}
          contentTypes={mockContentTypes}
        />,
        {
          wrapper: createQueryProviderWrapper(),
        }
      );

      expect(screen.getByText('My Blog Post')).toBeInTheDocument();
      expect(screen.getByText('Blog Post')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/Jan 1, 2024/i)).toBeInTheDocument();
      expect(screen.getByText(EntryStatus.Published)).toBeInTheDocument();
    });

    it('renders multiple scheduled content items', () => {
      const entry1 = createMockEntry({ id: 'entry-1', contentTypeId: 'blogPost' });
      const entry2 = createMockEntry({ id: 'entry-2', contentTypeId: 'article' });
      const entry3 = createMockEntry({ id: 'entry-3', contentTypeId: 'blogPost' });
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
      const scheduledAction3 = createMockScheduledAction({
        id: 'action-3',
        entityId: 'entry-3',
        entityLinkType: 'Entry',
      });
      const mockItems = [
        createMockScheduledContentItem({ id: 'entry-1', title: 'Entry 1' }),
        createMockScheduledContentItem({ id: 'entry-2', title: 'Entry 2' }),
        createMockScheduledContentItem({ id: 'entry-3', title: 'Entry 3' }),
      ];

      mockUseScheduledContent.mockReturnValue({
        items: mockItems,
        total: 3,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <ScheduledContentTable
          scheduledActions={[scheduledAction1, scheduledAction2, scheduledAction3]}
          entries={[entry1, entry2, entry3]}
          contentTypes={mockContentTypes}
        />,
        { wrapper: createQueryProviderWrapper() }
      );

      expect(screen.getByText('Entry 1')).toBeInTheDocument();
      expect(screen.getByText('Entry 2')).toBeInTheDocument();
      expect(screen.getByText('Entry 3')).toBeInTheDocument();
    });
  });

  describe('Status badges', () => {
    it('displays correct status badges for all status types', () => {
      const entry1 = createMockEntry({ id: 'entry-1', contentTypeId: 'blogPost' });
      const entry2 = createMockEntry({ id: 'entry-2', contentTypeId: 'article' });
      const entry3 = createMockEntry({ id: 'entry-3', contentTypeId: 'blogPost' });
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
      const scheduledAction3 = createMockScheduledAction({
        id: 'action-3',
        entityId: 'entry-3',
        entityLinkType: 'Entry',
      });
      const mockItems = [
        createMockScheduledContentItem({ id: 'entry-1', status: EntryStatus.Published }),
        createMockScheduledContentItem({ id: 'entry-2', status: EntryStatus.Changed }),
        createMockScheduledContentItem({ id: 'entry-3', status: EntryStatus.Draft }),
      ];

      mockUseScheduledContent.mockReturnValue({
        items: mockItems,
        total: 3,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <ScheduledContentTable
          scheduledActions={[scheduledAction1, scheduledAction2, scheduledAction3]}
          entries={[entry1, entry2, entry3]}
          contentTypes={mockContentTypes}
        />,
        { wrapper: createQueryProviderWrapper() }
      );

      expect(screen.getByText(EntryStatus.Published)).toBeInTheDocument();
      expect(screen.getByText(EntryStatus.Changed)).toBeInTheDocument();
      expect(screen.getByText(EntryStatus.Draft)).toBeInTheDocument();
    });
  });

  describe('EntryLink rendering', () => {
    it('renders EntryLink with correct URL', () => {
      const entry = createMockEntry({ id: 'entry-123', contentTypeId: 'blogPost' });
      const scheduledAction = createMockScheduledAction({
        id: 'action-1',
        entityId: 'entry-123',
        entityLinkType: 'Entry',
      });
      const mockItem = createMockScheduledContentItem({
        id: 'entry-123',
        title: 'My Entry',
      });

      mockUseScheduledContent.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <ScheduledContentTable
          scheduledActions={[scheduledAction]}
          entries={[entry]}
          contentTypes={mockContentTypes}
        />,
        {
          wrapper: createQueryProviderWrapper(),
        }
      );

      const link = screen.getByText('My Entry').closest('a');
      expect(link).toHaveAttribute(
        'href',
        'https://app.contentful.com/spaces/test-space/entries/entry-123'
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
