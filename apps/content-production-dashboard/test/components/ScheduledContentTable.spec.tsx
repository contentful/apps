import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ScheduledContentTable } from '../../src/components/ScheduledContentTable';
import { EntryStatus, ScheduledContentItem } from '../../src/utils/types';
import { mockSdk } from '../mocks';
import { createQueryProviderWrapper } from '../utils/createQueryProviderWrapper';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => ({}),
}));

const mockRefetch = vi.fn();
const mockUseScheduledContent = vi.fn();

vi.mock('../../src/hooks/useScheduledContent', () => ({
  useScheduledContent: (defaultLocale: string, page: number) =>
    mockUseScheduledContent(defaultLocale, page),
}));

const createMockScheduledContentItem = (
  overrides?: Partial<ScheduledContentItem>
): ScheduledContentItem => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    id: 'entry-1',
    title: 'Test Entry',
    contentType: 'Blog Post',
    contentTypeId: 'blogPost',
    creator: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
    },
    publishedDate: now.toISOString(),
    updatedDate: now.toISOString(),
    status: EntryStatus.Published,
    scheduledActionId: 'action-1',
    scheduledFor: futureDate.toISOString(),
    ...overrides,
  };
};

describe('ScheduledContentTable component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockClear();
    mockSdk.locales = { default: 'en-US' };
    mockSdk.ids.space = 'test-space';
  });

  describe('Loading state', () => {
    it('renders skeleton loader when fetching', () => {
      mockUseScheduledContent.mockReturnValue({
        items: [],
        total: 0,
        isFetching: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<ScheduledContentTable />, { wrapper: createQueryProviderWrapper() });

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Scheduled Date')).toBeInTheDocument();
      expect(screen.getByText('Published Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Content Type')).toBeInTheDocument();
      expect(screen.getByText('Creator')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders empty state when no items', () => {
      mockUseScheduledContent.mockReturnValue({
        items: [],
        total: 0,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<ScheduledContentTable />, { wrapper: createQueryProviderWrapper() });

      expect(screen.getByText('No entries found')).toBeInTheDocument();
    });
  });

  describe('Table rendering', () => {
    it('renders table with correct columns', () => {
      const mockItem = createMockScheduledContentItem();
      mockUseScheduledContent.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<ScheduledContentTable />, { wrapper: createQueryProviderWrapper() });

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Scheduled Date')).toBeInTheDocument();
      expect(screen.getByText('Published Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Content Type')).toBeInTheDocument();
      expect(screen.getByText('Creator')).toBeInTheDocument();
    });

    it('renders scheduled content items with correct data', () => {
      const mockItem = createMockScheduledContentItem({
        id: 'entry-1',
        title: 'My Blog Post',
        contentType: 'Blog Post',
        scheduledFor: '2024-01-15T10:00:00Z',
        publishedDate: '2024-01-01T00:00:00Z',
      });

      mockUseScheduledContent.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<ScheduledContentTable />, { wrapper: createQueryProviderWrapper() });

      expect(screen.getByText('My Blog Post')).toBeInTheDocument();
      expect(screen.getByText('Blog Post')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/Dec 31, 2023/i)).toBeInTheDocument();
      expect(screen.getByText(EntryStatus.Published)).toBeInTheDocument();
    });

    it('renders multiple scheduled content items', () => {
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

      render(<ScheduledContentTable />, { wrapper: createQueryProviderWrapper() });

      expect(screen.getByText('Entry 1')).toBeInTheDocument();
      expect(screen.getByText('Entry 2')).toBeInTheDocument();
      expect(screen.getByText('Entry 3')).toBeInTheDocument();
    });
  });

  describe('Status badges', () => {
    it('displays correct status badges for all status types', () => {
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

      render(<ScheduledContentTable />, { wrapper: createQueryProviderWrapper() });

      expect(screen.getByText(EntryStatus.Published)).toBeInTheDocument();
      expect(screen.getByText(EntryStatus.Changed)).toBeInTheDocument();
      expect(screen.getByText(EntryStatus.Draft)).toBeInTheDocument();
    });
  });

  describe('EntryLink rendering', () => {
    it('renders EntryLink with correct URL', () => {
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

      render(<ScheduledContentTable />, { wrapper: createQueryProviderWrapper() });

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
