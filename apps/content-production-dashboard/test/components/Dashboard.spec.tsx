import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Dashboard from '../../src/components/Dashboard';
import { QueryProvider } from '../../src/providers/QueryProvider';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const mockRefetch = vi.fn();
vi.mock('../../src/hooks/useAllEntries', () => ({
  useAllEntries: () => ({
    entries: [],
    total: 0,
    isFetching: false,
    error: null,
    refetch: mockRefetch,
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
});
