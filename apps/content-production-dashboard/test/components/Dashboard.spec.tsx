import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Dashboard from '../../src/components/Dashboard';
import { QueryProvider } from '../../src/providers/QueryProvider';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const mockRefetchEntries = vi.fn();
const mockRefetchScheduledActions = vi.fn();

vi.mock('../../src/hooks/useAllEntries', () => ({
  useAllEntries: () => ({
    entries: [],
    total: 0,
    isFetchingEntries: false,
    fetchingEntriesError: null,
    refetchEntries: mockRefetchEntries,
    fetchedAt: new Date(),
  }),
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
  });

  it('renders the dashboard heading', () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    expect(screen.getByText('Content Dashboard')).toBeInTheDocument();
  });

  it('renders all metric cards', () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    expect(screen.getByText('Total Published')).toBeInTheDocument();
    expect(screen.getByText('Average Time to Publish')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Recently Published')).toBeInTheDocument();
    expect(screen.getByText('Needs Update')).toBeInTheDocument();
  });

  it('calls refetchEntries and refetchScheduledActions when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<Dashboard />, { wrapper: createWrapper() });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockRefetchEntries).toHaveBeenCalledTimes(1);
    expect(mockRefetchScheduledActions).toHaveBeenCalledTimes(1);
  });
});
