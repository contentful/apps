import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NeedsUpdateTable } from '../../src/components/NeedsUpdateTable';
import { mockSdk } from '../mocks';
import { createQueryProviderWrapper } from '../utils/createQueryProviderWrapper';
import { createMockEntry, createMockContentType } from '../utils/testHelpers';
import { EntryProps } from 'contentful-management';
import { NeedsUpdateItem } from '../../src/hooks/useNeedsUpdateContent';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => ({}),
}));

const mockRefetch = vi.fn();
const mockUseNeedsUpdate = vi.fn();

vi.mock('../../src/hooks/useNeedsUpdateContent', () => ({
  useNeedsUpdate: (entries: EntryProps[], page: number, contentTypes: unknown) =>
    mockUseNeedsUpdate(entries, page, contentTypes),
}));

const createMockNeedsUpdateItem = (overrides?: Partial<NeedsUpdateItem>): NeedsUpdateItem => {
  return {
    id: 'entry-1',
    title: 'Test Entry',
    age: 180,
    publishedDate: '2024-01-01T00:00:00Z',
    creator: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
    },
    contentType: 'Blog Post',
    ...overrides,
  };
};

describe('NeedsUpdateTable component', () => {
  const mockContentTypes = new Map([
    ['blogPost', createMockContentType({ id: 'blogPost', name: 'Blog Post' })],
    ['article', createMockContentType({ id: 'article', name: 'Article' })],
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockClear();
    mockSdk.locales = { default: 'en-US' };
    mockSdk.ids.space = 'test-space';
    mockSdk.parameters.installation = { needsUpdateMonths: 6 };
  });

  afterEach(() => {
    cleanup();
  });

  describe('Table rendering', () => {
    it('renders table with correct columns', () => {
      const mockEntries = [createMockEntry()];
      const mockItem = createMockNeedsUpdateItem();
      mockUseNeedsUpdate.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<NeedsUpdateTable entries={mockEntries} contentTypes={mockContentTypes} />, {
        wrapper: createQueryProviderWrapper(),
      });

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Published Date')).toBeInTheDocument();
      expect(screen.getByText('Content Type')).toBeInTheDocument();
      expect(screen.getByText('Creator')).toBeInTheDocument();
    });

    it('renders needs update items with correct data', () => {
      const mockEntries = [createMockEntry()];
      const mockItem = createMockNeedsUpdateItem({
        id: 'entry-1',
        title: 'My Blog Post',
        contentType: 'Blog Post',
        age: 200,
        publishedDate: '2024-01-15T10:00:00Z',
      });

      mockUseNeedsUpdate.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<NeedsUpdateTable entries={mockEntries} contentTypes={mockContentTypes} />, {
        wrapper: createQueryProviderWrapper(),
      });

      expect(screen.getByText('My Blog Post')).toBeInTheDocument();
      expect(screen.getByText('Blog Post')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('200 days')).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
    });

    it('renders multiple needs update items', () => {
      const mockEntries = [createMockEntry()];
      const mockItems = [
        createMockNeedsUpdateItem({ id: 'entry-1', title: 'Entry 1', age: 200 }),
        createMockNeedsUpdateItem({ id: 'entry-2', title: 'Entry 2', age: 150 }),
        createMockNeedsUpdateItem({ id: 'entry-3', title: 'Entry 3', age: 100 }),
      ];

      mockUseNeedsUpdate.mockReturnValue({
        items: mockItems,
        total: 3,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<NeedsUpdateTable entries={mockEntries} contentTypes={mockContentTypes} />, {
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
      const mockItem = createMockNeedsUpdateItem({
        id: 'entry-123',
        title: 'My Entry',
      });

      mockUseNeedsUpdate.mockReturnValue({
        items: [mockItem],
        total: 1,
        isFetching: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<NeedsUpdateTable entries={mockEntries} contentTypes={mockContentTypes} />, {
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
