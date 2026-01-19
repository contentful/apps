import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Dashboard from '../../src/components/Dashboard';
import { QueryProvider } from '../../src/providers/QueryProvider';
import { createMockEntry, renderWithAct } from '../utils/testHelpers';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const mockRefetchEntries = vi.fn();
const mockRefetchScheduledActions = vi.fn();

const mockEntries = [
  createMockEntry({ id: 'entry-1', contentTypeId: 'blogPost' }),
  createMockEntry({ id: 'entry-2', contentTypeId: 'article' }),
];

const mockUseAllEntries = vi.fn(() => ({
  entries: mockEntries,
  total: mockEntries.length,
  isFetchingEntries: false,
  fetchingEntriesError: null,
  refetchEntries: mockRefetchEntries,
  fetchedAt: new Date(),
}));

vi.mock('../../src/hooks/useAllEntries', () => ({
  useAllEntries: () => mockUseAllEntries(),
}));

vi.mock('../../src/hooks/useScheduledActions', () => ({
  useScheduledActions: () => ({
    scheduledActions: [],
    total: 0,
    isFetchingScheduledActions: false,
    fetchingScheduledActionsError: null,
    refetchScheduledActions: mockRefetchScheduledActions,
    fetchedAt: new Date(),
  }),
}));

const createWrapper = () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryProvider>{children}</QueryProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('Dashboard component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAllEntries.mockReturnValue({
      entries: mockEntries,
      total: mockEntries.length,
      isFetchingEntries: false,
      fetchingEntriesError: null,
      refetchEntries: mockRefetchEntries,
      fetchedAt: new Date(),
    });
  });

  it('renders the dashboard heading', async () => {
    await renderWithAct(<Dashboard />, { wrapper: createWrapper() });

    expect(screen.getByText('Content Dashboard')).toBeInTheDocument();
  });

  it('renders all metric cards', async () => {
    await renderWithAct(<Dashboard />, { wrapper: createWrapper() });

    expect(screen.getByText('Total Published')).toBeInTheDocument();
    expect(screen.getByText('Average Time to Publish')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Recently Published')).toBeInTheDocument();
    expect(screen.getByText('Needs Update')).toBeInTheDocument();
  });

  it('calls refetchEntries and refetchScheduledActions when refresh button is clicked', async () => {
    const user = userEvent.setup();
    await renderWithAct(<Dashboard />, { wrapper: createWrapper() });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockRefetchEntries).toHaveBeenCalledTimes(1);
    expect(mockRefetchScheduledActions).toHaveBeenCalledTimes(1);
  });

  describe('Content Publishing Trends Section', () => {
    beforeEach(() => {
      mockSdk.parameters.installation = {};
    });

    it('renders components correctly', async () => {
      await renderWithAct(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Content Publishing Trends')).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('New Entries')).toBeInTheDocument();
    });

    it('default time range is "year"', async () => {
      await renderWithAct(<Dashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Past Year')).toBeInTheDocument();
    });

    it('renders all TIME_RANGE_OPTIONS in dropdown', async () => {
      const user = userEvent.setup();

      await renderWithAct(<Dashboard />, { wrapper: createWrapper() });

      const select = screen.getByRole('combobox');
      await user.click(select);

      expect(screen.getByText('Past Month')).toBeInTheDocument();
      expect(screen.getByText('Past 3 Months')).toBeInTheDocument();
      expect(screen.getByText('Past 6 Months')).toBeInTheDocument();
      expect(screen.getByText('Past Year')).toBeInTheDocument();
      expect(screen.getByText('Year to Date')).toBeInTheDocument();
    });
  });
});
