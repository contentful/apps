import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RecentlyPublishedTable } from '../../src/components/RecentlyPublishedTable';
import { RecentlyPublishedItem } from '../../src/hooks/useRecentlyPublishedContent';
import { mockSdk } from '../mocks';
import { createQueryProviderWrapper } from '../utils/createQueryProviderWrapper';
import { EntryProps } from 'contentful-management';
import { createMockContentType } from '../utils/testHelpers';

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
    defaultLocale: string,
    contentTypes: unknown
  ) =>
    mockUseRecentlyPublishedContent(
      page,
      entries,
      recentlyPublishedDate,
      defaultLocale,
      contentTypes
    ),
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
  const mockContentTypes = new Map([
    ['blogPost', createMockContentType({ id: 'blogPost', name: 'Blog Post' })],
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.locales = { default: 'en-US' };
    mockSdk.ids.space = 'test-space';
    mockSdk.parameters.installation = { recentlyPublishedDays: 7 };
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

      render(<RecentlyPublishedTable entries={mockEntries} contentTypes={mockContentTypes} />, {
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

      render(<RecentlyPublishedTable entries={mockEntries} contentTypes={mockContentTypes} />, {
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

      render(<RecentlyPublishedTable entries={mockEntries} contentTypes={mockContentTypes} />, {
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

      render(<RecentlyPublishedTable entries={mockEntries} contentTypes={mockContentTypes} />, {
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
});
