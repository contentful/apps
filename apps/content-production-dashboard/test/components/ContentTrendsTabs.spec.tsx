import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ContentTrendsTabs } from '../../src/components/ContentTrendsTabs';
import { QueryProvider } from '../../src/providers/QueryProvider';
import { createMockEntry, createMockUser } from '../utils/testHelpers';
import { EntryProps } from 'contentful-management';

const mockProcessNewEntries = vi.fn();
const mockProcessContentTypeTrends = vi.fn();
const mockProcessCreatorTrends = vi.fn();

vi.mock('../../src/utils/trendsDataProcessor', () => ({
  processNewEntries: (entries: EntryProps[], options: any) =>
    mockProcessNewEntries(entries, options),
  processContentTypeTrends: (
    entries: EntryProps[],
    options: any,
    contentTypes?: Map<string, string>
  ) => mockProcessContentTypeTrends(entries, options, contentTypes),
  processCreatorTrends: (
    entries: EntryProps[],
    options: any,
    creatorsNames?: Map<string, string>,
    contentTypes?: Map<string, string>
  ) => mockProcessCreatorTrends(entries, options, creatorsNames, contentTypes),
}));

const mockGetManyForSpace = vi.fn();
const mockSdk: any = {
  ids: {
    space: 'test-space',
    environment: 'test-environment',
  },
  cma: {
    user: {
      getManyForSpace: mockGetManyForSpace,
    },
  },
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const mockContentTypes = new Map<string, string>();
const mockCreatorsNames = new Map<string, string>();
let mockIsFetchingContentTypes = false;

const mockUseContentTypes = vi.fn(() => ({
  contentTypes: mockContentTypes,
  isFetchingContentTypes: mockIsFetchingContentTypes,
  fetchingContentTypesError: null,
}));

vi.mock('../../src/hooks/useContentTypes', () => ({
  useContentTypes: () => mockUseContentTypes(),
}));

const createWrapper = () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryProvider>{children}</QueryProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('ContentTrendsTabs component', () => {
  const mockEntries: EntryProps[] = [
    createMockEntry({ id: 'entry-1', contentTypeId: 'blogPost', createdById: 'user-1' }),
    createMockEntry({ id: 'entry-2', contentTypeId: 'article', createdById: 'user-2' }),
    createMockEntry({ id: 'entry-3', contentTypeId: 'blogPost', createdById: 'user-1' }),
  ];

  const mockOverallData = [
    { date: 'Jan 2024', 'New Content': 5 },
    { date: 'Feb 2024', 'New Content': 8 },
  ];

  const mockContentTypeData = {
    data: [
      { date: 'Jan 2024', 'Blog Post': 3, Article: 2 },
      { date: 'Feb 2024', 'Blog Post': 5, Article: 3 },
    ],
    contentTypes: ['Blog Post', 'Article'],
  };

  const mockCreatorData = {
    data: [
      { date: 'Jan 2024', 'John Doe': 3, 'Jane Smith': 2 },
      { date: 'Feb 2024', 'John Doe': 5, 'Jane Smith': 3 },
    ],
    creators: ['John Doe', 'Jane Smith'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockContentTypes.clear();
    mockContentTypes.set('blogPost', 'Blog Post');
    mockContentTypes.set('article', 'Article');
    mockIsFetchingContentTypes = false;

    mockCreatorsNames.clear();
    mockCreatorsNames.set('user-1', 'John Doe');
    mockCreatorsNames.set('user-2', 'Jane Smith');

    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isFetchingContentTypes: mockIsFetchingContentTypes,
      fetchingContentTypesError: null,
    });

    mockProcessNewEntries.mockReturnValue(mockOverallData);
    mockProcessContentTypeTrends.mockReturnValue(mockContentTypeData);
    mockProcessCreatorTrends.mockReturnValue(mockCreatorData);

    mockGetManyForSpace.mockResolvedValue({
      items: [
        createMockUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' }),
        createMockUser({ id: 'user-2', firstName: 'Jane', lastName: 'Smith' }),
      ],
    });
  });

  describe('Rendering', () => {
    it('renders all three tabs', () => {
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('New Entries')).toBeInTheDocument();
      expect(screen.getByText('By Content Type')).toBeInTheDocument();
      expect(screen.getByText('By Creator')).toBeInTheDocument();
    });

    it('default tab is "overall"', () => {
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Content:')).toBeInTheDocument();
      expect(screen.getByText('New Content')).toBeInTheDocument();
    });
  });

  describe('Overall Trends Tab', () => {
    it('renders ChartWrapper with overallData', () => {
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      expect(mockProcessNewEntries).toHaveBeenCalledWith(mockEntries, { timeRange: 'year' });
      expect(screen.getByText('Content:')).toBeInTheDocument();
      expect(screen.getByText('New Content')).toBeInTheDocument();
    });

    it('calls processOverallTrends with filteredEntries and timeRange', () => {
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="month" />,
        { wrapper: createWrapper() }
      );

      expect(mockProcessNewEntries).toHaveBeenCalledWith(expect.arrayContaining(mockEntries), {
        timeRange: 'month',
      });
    });
  });

  describe('By Content Type Tab', () => {
    it('shows Spinner when isFetchingContentTypes is true', async () => {
      mockIsFetchingContentTypes = true;
      mockUseContentTypes.mockReturnValue({
        contentTypes: new Map(),
        isFetchingContentTypes: true,
        fetchingContentTypesError: null,
      });

      const user = userEvent.setup();
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      const contentTypeTab = screen.getByText('By Content Type');
      await user.click(contentTypeTab);

      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('shows "No content type data available" message when no content types are available', async () => {
      mockProcessContentTypeTrends.mockReturnValue({
        data: [],
        contentTypes: [],
      });

      const user = userEvent.setup();
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      const contentTypeTab = screen.getByText('By Content Type');
      await user.click(contentTypeTab);

      await waitFor(() => {
        expect(
          screen.getByText('No content type data available for the selected time range.')
        ).toBeInTheDocument();
      });
    });

    it('renders ChartWrapper when data is available', async () => {
      const user = userEvent.setup();
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      const contentTypeTab = screen.getByText('By Content Type');
      await user.click(contentTypeTab);

      await waitFor(() => {
        expect(mockProcessContentTypeTrends).toHaveBeenCalledWith(
          mockEntries,
          { timeRange: 'year' },
          mockContentTypes
        );
        expect(screen.getByText('Content Types:')).toBeInTheDocument();
        expect(screen.getByText('Blog Post')).toBeInTheDocument();
        expect(screen.getByText('Article')).toBeInTheDocument();
      });
    });

    it('calls processContentTypeTrends with entries, timeRange, and contentTypes', async () => {
      const user = userEvent.setup();
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      const contentTypeTab = screen.getByText('By Content Type');
      await user.click(contentTypeTab);

      await waitFor(() => {
        expect(mockProcessContentTypeTrends).toHaveBeenCalledWith(
          mockEntries,
          { timeRange: 'year' },
          mockContentTypes
        );
      });
    });
  });

  describe('By Creator Tab', () => {
    it('fetches users from SDK when "byCreator" tab is selected', async () => {
      const user = userEvent.setup();
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      await waitFor(() => {
        expect(mockGetManyForSpace).toHaveBeenCalledWith({
          spaceId: 'test-space',
        });
      });
    });

    it('maps user IDs to names correctly (firstName + lastName)', async () => {
      const user = userEvent.setup();
      mockGetManyForSpace.mockResolvedValue({
        items: [createMockUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' })],
      });

      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      await waitFor(() => {
        expect(mockProcessCreatorTrends).toHaveBeenCalled();
      });
    });

    it('shows Spinner when isLoadingUsers is true', async () => {
      const user = userEvent.setup();
      mockGetManyForSpace.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('shows "No creator data available" message when no creators are available', async () => {
      mockProcessCreatorTrends.mockReturnValue({
        data: [],
        creators: [],
      });

      const user = userEvent.setup();
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      await waitFor(() => {
        expect(mockGetManyForSpace).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(
          screen.getByText('No creator data available for the selected time range.')
        ).toBeInTheDocument();
      });
    });

    it('renders ChartWrapper when creator data is available', async () => {
      const user = userEvent.setup();
      render(
        <ContentTrendsTabs entries={mockEntries} trackedContentTypes={[]} timeRange="year" />,
        { wrapper: createWrapper() }
      );

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      await waitFor(() => {
        expect(mockProcessCreatorTrends).toHaveBeenCalledWith(
          mockEntries,
          { timeRange: 'year' },
          mockCreatorsNames,
          mockContentTypes
        );
        expect(screen.getByText('Creators:')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });
});
