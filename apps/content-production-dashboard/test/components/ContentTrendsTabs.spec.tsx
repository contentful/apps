import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentTrendsTabs } from '../../src/components/ContentTrendsTabs';
import { QueryProvider } from '../../src/providers/QueryProvider';
import { createMockEntry, createMockUser, renderWithAct } from '../utils/testHelpers';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import { CreatorViewSetting, TimeRange } from '../../src/utils/types';

const mockGenerateNewEntriesChartData = vi.fn();
const mockGenerateContentTypeChartData = vi.fn();
const mockGenerateCreatorChartData = vi.fn();

vi.mock('../../src/utils/trendsDataProcessor', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/trendsDataProcessor')>();
  return {
    ...actual,
    generateNewEntriesChartData: (
      entries: EntryProps[],
      options: any,
      contentTypes?: Map<string, ContentTypeProps>
    ) => mockGenerateNewEntriesChartData(entries, options, contentTypes),
    generateContentTypeChartData: (
      entries: EntryProps[],
      options: any,
      contentTypes?: Map<string, ContentTypeProps>
    ) => mockGenerateContentTypeChartData(entries, options, contentTypes),
    generateCreatorChartData: (
      entries: EntryProps[],
      options: any,
      creatorsNames?: Map<string, string>,
      contentTypes?: Map<string, ContentTypeProps>
    ) => mockGenerateCreatorChartData(entries, options, creatorsNames, contentTypes),
  };
});

const mockGetForSpace = vi.fn();
const mockGetManyContentTypes = vi.fn().mockResolvedValue({
  items: [
    { sys: { id: 'article' }, name: 'Article' },
    { sys: { id: 'blogPost' }, name: 'Blog Post' },
    { sys: { id: 'page' }, name: 'Page' },
    { sys: { id: 'product' }, name: 'Product' },
    { sys: { id: 'video' }, name: 'Video' },
  ],
});
const mockSdk: any = {
  ids: {
    space: 'test-space',
    environment: 'test-environment',
  },
  cma: {
    user: {
      getForSpace: mockGetForSpace,
    },
    contentType: {
      getMany: mockGetManyContentTypes,
    },
  },
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const mockUseUsers = vi.fn();
const mockRefetchUsers = vi.fn();

vi.mock('../../src/hooks/useUsers', () => ({
  useUsers: (userIds: string[]) => mockUseUsers(userIds),
}));

const mockContentTypes = new Map<string, ContentTypeProps>();
const mockCreatorsNames = new Map<string, string>();
let mockIsFetchingContentTypes = false;

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

  const mockNewEntriesData = [
    { date: 'Jan 2024', 'New Content': 5 },
    { date: 'Feb 2024', 'New Content': 8 },
  ];

  const mockContentTypeData = {
    data: [
      { date: 'Jan 2024', blogPost: 3, article: 2 },
      { date: 'Feb 2024', blogPost: 5, article: 3 },
    ],
    processedContentTypes: new Map<string, string>([
      ['blogPost', 'Blog Post'],
      ['article', 'Article'],
    ]),
  };

  const mockCreatorData = {
    data: [
      { date: 'Jan 2024', 'John Doe': 3, 'Jane Smith': 2 },
      { date: 'Feb 2024', 'John Doe': 5, 'Jane Smith': 3 },
    ],
    creators: ['John Doe', 'Jane Smith'],
    totalsByCreator: {
      'John Doe': 8,
      'Jane Smith': 5,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockContentTypes.clear();
    mockContentTypes.set('article', {
      sys: { id: 'article', type: 'ContentType', version: 0 },
      name: 'Article',
    } as ContentTypeProps);
    mockContentTypes.set('blogPost', {
      sys: { id: 'blogPost', type: 'ContentType', version: 0 },
      name: 'Blog Post',
    } as ContentTypeProps);
    mockContentTypes.set('page', {
      sys: { id: 'page', type: 'ContentType', version: 0 },
      name: 'Page',
    } as ContentTypeProps);
    mockContentTypes.set('product', {
      sys: { id: 'product', type: 'ContentType', version: 0 },
      name: 'Product',
    } as ContentTypeProps);
    mockContentTypes.set('video', {
      sys: { id: 'video', type: 'ContentType', version: 0 },
      name: 'Video',
    } as ContentTypeProps);
    mockIsFetchingContentTypes = false;

    mockCreatorsNames.clear();
    mockCreatorsNames.set('user-1', 'John Doe');
    mockCreatorsNames.set('user-2', 'Jane Smith');

    mockGenerateNewEntriesChartData.mockReturnValue(mockNewEntriesData);
    mockGenerateContentTypeChartData.mockReturnValue(mockContentTypeData);
    mockGenerateCreatorChartData.mockReturnValue(mockCreatorData);

    mockGetForSpace.mockResolvedValue({
      sys: { id: 'user-1' },
      firstName: 'John',
      lastName: 'Doe',
    });

    // Mock useUsers hook to return users map
    const mockUsersMap = new Map();
    mockUsersMap.set(
      'user-1',
      createMockUser({ id: 'user-1', firstName: 'John', lastName: 'Doe' })
    );
    mockUsersMap.set(
      'user-2',
      createMockUser({ id: 'user-2', firstName: 'Jane', lastName: 'Smith' })
    );

    mockUseUsers.mockReturnValue({
      usersMap: mockUsersMap,
      isFetching: false,
      error: null,
      refetch: mockRefetchUsers,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('renders all three tabs', async () => {
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('New Entries')).toBeInTheDocument();
      expect(screen.getByText('By Content Type')).toBeInTheDocument();
      expect(screen.getByText('By Creator')).toBeInTheDocument();
    });

    it('default tab is "newEntries"', async () => {
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Content:')).toBeInTheDocument();
      expect(screen.getByText('New Content')).toBeInTheDocument();
    });
  });

  describe('New Entries Tab', () => {
    it('renders ChartWrapper with newEntriesData', async () => {
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockGenerateNewEntriesChartData).toHaveBeenCalledWith(
          mockEntries,
          { timeRange: TimeRange.Year },
          expect.any(Map)
        );
      });
      expect(screen.getByText('Content:')).toBeInTheDocument();
      expect(screen.getByText('New Content')).toBeInTheDocument();
    });

    it('calls generateNewEntriesChartData with filteredEntries and timeRange', async () => {
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Month}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockGenerateNewEntriesChartData).toHaveBeenCalledWith(
          expect.arrayContaining(mockEntries),
          {
            timeRange: TimeRange.Month,
          },
          expect.any(Map)
        );
      });
    });
  });

  describe('By Content Type Tab', () => {
    it('shows Spinner when isFetchingContentTypes is true', async () => {
      mockIsFetchingContentTypes = true;

      const user = userEvent.setup();
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={new Map()}
          isFetchingContentTypes={true}
        />,
        { wrapper: createWrapper() }
      );

      const contentTypeTab = screen.getByText('By Content Type');
      await user.click(contentTypeTab);

      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('shows "No content type data available" message when no content types are available', async () => {
      mockGenerateContentTypeChartData.mockReturnValue({
        data: [],
        processedContentTypes: new Map<string, string>(),
      });

      const user = userEvent.setup();
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      const contentTypeTab = screen.getByText('By Content Type');
      await user.click(contentTypeTab);

      await waitFor(() => {
        expect(screen.getByText('No data to display')).toBeInTheDocument();
        expect(
          screen.getByText('Data will display once you select content types.')
        ).toBeInTheDocument();
      });
    });

    it('renders ChartWrapper when data is available', async () => {
      const user = userEvent.setup();
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      const contentTypeTab = screen.getByText('By Content Type');
      await user.click(contentTypeTab);

      await waitFor(() => {
        expect(mockGenerateContentTypeChartData).toHaveBeenCalledWith(
          mockEntries,
          { timeRange: 'year' },
          mockContentTypes
        );
        expect(screen.getByText('Content Types:')).toBeInTheDocument();
        expect(screen.getAllByText('Blog Post')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Article')[0]).toBeInTheDocument();
      });
    });

    it('calls generateContentTypeChartData with entries, timeRange, and contentTypes', async () => {
      const user = userEvent.setup();
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      const contentTypeTab = screen.getByText('By Content Type');
      await user.click(contentTypeTab);

      await waitFor(() => {
        expect(mockGenerateContentTypeChartData).toHaveBeenCalledWith(
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
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      await waitFor(() => {
        expect(mockUseUsers).toHaveBeenCalledWith(['user-1', 'user-2']);
      });
    });

    it('maps user IDs to names correctly (firstName + lastName)', async () => {
      const user = userEvent.setup();

      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      await waitFor(() => {
        expect(mockGenerateCreatorChartData).toHaveBeenCalled();
      });
    });

    it('shows Spinner when isLoadingUsers is true', async () => {
      const user = userEvent.setup();
      mockUseUsers.mockReturnValue({
        usersMap: new Map(),
        isFetching: true,
        error: null,
        refetch: mockRefetchUsers,
      });

      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('shows "No creator data available" message when no creators are available', async () => {
      mockGenerateCreatorChartData.mockReturnValue({
        data: [],
        creators: [],
        totalsByCreator: {},
      });

      const user = userEvent.setup();
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      await waitFor(() => {
        expect(mockUseUsers).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('No data to display')).toBeInTheDocument();
        expect(screen.getByText('Data will display once you select creators.')).toBeInTheDocument();
      });
    });

    it('renders ChartWrapper when creator data is available', async () => {
      const user = userEvent.setup();
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
        />,
        { wrapper: createWrapper() }
      );

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      await waitFor(() => {
        expect(mockGenerateCreatorChartData).toHaveBeenCalled();
        expect(screen.getByText('Creators:')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('Default Content Types Functionality', () => {
    it('ContentTypeSelector renders in correct tabs', async () => {
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Content types')).toBeInTheDocument();
      });

      expect(screen.getByText('Content types')).toBeInTheDocument();

      const user = userEvent.setup();
      const contentTypeTab = screen.getByText('By Content Type');
      await user.click(contentTypeTab);

      await waitFor(() => {
        expect(screen.getByText('Content types')).toBeInTheDocument();
      });

      const creatorTab = screen.getByText('By Creator');
      await user.click(creatorTab);

      await waitFor(() => {
        expect(screen.queryByText('Content types')).not.toBeInTheDocument();
      });
    });

    it('initializes with defaultContentTypes provided', async () => {
      const defaultTypes = ['blogPost', 'article'];

      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={defaultTypes}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getAllByText('Article')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Blog Post')[0]).toBeInTheDocument();
      });
      expect(mockGenerateNewEntriesChartData).toHaveBeenCalled();
    });

    it('initializes without defaultContentTypes (first 5 sorted)', async () => {
      await renderWithAct(
        <ContentTrendsTabs
          entries={mockEntries}
          defaultContentTypes={[]}
          timeRange={TimeRange.Year}
          contentTypes={mockContentTypes}
          isFetchingContentTypes={mockIsFetchingContentTypes}
          defaultCreatorViewSetting={CreatorViewSetting.TopFiveCreators}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getAllByText('Article')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Blog Post')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Page')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Product')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Video')[0]).toBeInTheDocument();
      });
      expect(mockGenerateNewEntriesChartData).toHaveBeenCalled();
    });
  });
});
