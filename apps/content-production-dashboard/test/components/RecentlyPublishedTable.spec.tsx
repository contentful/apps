import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RecentlyPublishedTable } from '../../src/components/RecentlyPublishedTable';
import { RecentlyPublishedItem } from '../../src/hooks/useRecentlyPublishedContent';
import { mockSdk } from '../mocks';
import { createQueryProviderWrapper } from '../utils/createQueryProviderWrapper';
import { EntryProps } from 'contentful-management';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => ({}),
}));

const mockUseRecentlyPublishedContent = vi.fn();

vi.mock('../../src/hooks/useRecentlyPublishedContent', () => ({
  useRecentlyPublishedContent: (
    page: number,
    entries: EntryProps[],
    recentlyPublishedDate: Date,
    defaultLocale: string
  ) => mockUseRecentlyPublishedContent(page, entries, recentlyPublishedDate, defaultLocale),
}));

const createMockRecentlyPublishedItem = (
  overrides?: Partial<RecentlyPublishedItem>
): RecentlyPublishedItem => {
  const now = new Date();

  return {
    id: 'entry-1',
    title: 'Test Entry',
    contentType: 'Blog Post',
    creator: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
    },
    publishedDate: now.toISOString(),
    ...overrides,
  };
};

const createMockEntry = (overrides?: Partial<EntryProps>): EntryProps => {
  return {
    sys: {
      id: 'entry-1',
      type: 'Entry',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      contentType: {
        sys: {
          id: 'blogPost',
          type: 'Link',
          linkType: 'ContentType',
        },
      },
    },
    fields: {},
    ...overrides,
  } as EntryProps;
};

describe('RecentlyPublishedTable component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.locales = { default: 'en-US' };
    mockSdk.ids.space = 'test-space';
    mockSdk.parameters.installation = { recentlyPublishedDays: 7 };
  });

  describe('Loading state', () => {
    it('renders skeleton loader when fetching', () => {
      const mockEntries = [createMockEntry()];
      mockUseRecentlyPublishedContent.mockReturnValue({
        items: [],
        total: 0,
        isFetching: true,
        error: null,
      });

      render(<RecentlyPublishedTable entries={mockEntries} />, {
        wrapper: createQueryProviderWrapper(),
      });

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Published Date')).toBeInTheDocument();
      expect(screen.getByText('Content Type')).toBeInTheDocument();
      expect(screen.getByText('Creator')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('renders error display when error occurs', () => {
      const mockEntries = [createMockEntry()];
      const mockError = new Error('Failed to load entries');
      mockUseRecentlyPublishedContent.mockReturnValue({
        items: [],
        total: 0,
        isFetching: false,
        error: mockError,
      });

      render(<RecentlyPublishedTable entries={mockEntries} />, {
        wrapper: createQueryProviderWrapper(),
      });

      expect(screen.getByText('Error loading entries')).toBeInTheDocument();
      expect(screen.getByText('Failed to load entries')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders empty state when no items', () => {
      const mockEntries = [createMockEntry()];
      mockUseRecentlyPublishedContent.mockReturnValue({
        items: [],
        total: 0,
        isFetching: false,
        error: null,
      });

      render(<RecentlyPublishedTable entries={mockEntries} />, {
        wrapper: createQueryProviderWrapper(),
      });

      expect(screen.getByText('No entries found')).toBeInTheDocument();
    });
  });

  describe('Table rendering', () => {
    it('renders table with correct columns', () => {
      const mockEntries = [createMockEntry()];
      const mockItem = createMockRecentlyPublishedItem();
      mockUseRecentlyPublishedContent.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
      });

      render(<RecentlyPublishedTable entries={mockEntries} />, {
        wrapper: createQueryProviderWrapper(),
      });

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Published Date')).toBeInTheDocument();
      expect(screen.getByText('Content Type')).toBeInTheDocument();
      expect(screen.getByText('Creator')).toBeInTheDocument();
    });

    it('renders recently published items with correct data', () => {
      const mockEntries = [createMockEntry()];
      const mockItem = createMockRecentlyPublishedItem({
        id: 'entry-1',
        title: 'My Blog Post',
        contentType: 'Blog Post',
        publishedDate: '2024-01-15T10:00:00Z',
      });

      mockUseRecentlyPublishedContent.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
      });

      render(<RecentlyPublishedTable entries={mockEntries} />, {
        wrapper: createQueryProviderWrapper(),
      });

      expect(screen.getByText('My Blog Post')).toBeInTheDocument();
      expect(screen.getByText('Blog Post')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
    });

    it('renders multiple recently published items', () => {
      const mockEntries = [createMockEntry()];
      const mockItems = [
        createMockRecentlyPublishedItem({ id: 'entry-1', title: 'Entry 1' }),
        createMockRecentlyPublishedItem({ id: 'entry-2', title: 'Entry 2' }),
        createMockRecentlyPublishedItem({ id: 'entry-3', title: 'Entry 3' }),
      ];

      mockUseRecentlyPublishedContent.mockReturnValue({
        items: mockItems,
        total: 3,
        isFetching: false,
        error: null,
      });

      render(<RecentlyPublishedTable entries={mockEntries} />, {
        wrapper: createQueryProviderWrapper(),
      });

      expect(screen.getByText('Entry 1')).toBeInTheDocument();
      expect(screen.getByText('Entry 2')).toBeInTheDocument();
      expect(screen.getByText('Entry 3')).toBeInTheDocument();
    });
  });

  describe('EntryLink rendering', () => {
    it('renders EntryLink with correct URL', () => {
      const mockEntries = [createMockEntry()];
      const mockItem = createMockRecentlyPublishedItem({
        id: 'entry-123',
        title: 'My Entry',
      });

      mockUseRecentlyPublishedContent.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
      });

      render(<RecentlyPublishedTable entries={mockEntries} />, {
        wrapper: createQueryProviderWrapper(),
      });

      const link = screen.getByText('My Entry').closest('a');
      expect(link).toHaveAttribute(
        'href',
        'https://app.contentful.com/spaces/test-space/entries/entry-123'
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Pagination', () => {
    it('renders pagination when total items exceed page size', () => {
      const mockEntries = [createMockEntry()];
      const mockItems = [createMockRecentlyPublishedItem({ id: 'entry-1', title: 'Entry 1' })];

      mockUseRecentlyPublishedContent.mockReturnValue({
        items: mockItems,
        total: 15,
        isFetching: false,
        error: null,
      });

      render(<RecentlyPublishedTable entries={mockEntries} />, {
        wrapper: createQueryProviderWrapper(),
      });

      expect(screen.getByTestId('cf-ui-pagination')).toBeInTheDocument();
    });

    it('does not render pagination when total items are less than page size', () => {
      const mockEntries = [createMockEntry()];
      const mockItems = [createMockRecentlyPublishedItem({ id: 'entry-1', title: 'Entry 1' })];

      mockUseRecentlyPublishedContent.mockReturnValue({
        items: mockItems,
        total: 5,
        isFetching: false,
        error: null,
      });

      render(<RecentlyPublishedTable entries={mockEntries} />, {
        wrapper: createQueryProviderWrapper(),
      });

      expect(screen.queryByTestId('cf-ui-pagination')).not.toBeInTheDocument();
    });
  });
});
