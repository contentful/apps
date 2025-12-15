import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockSdk } from '../mocks';
import Page from '../../src/locations/Page';
import { EntryProps } from 'contentful-management';

// Mock TanStack Query
const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => mockUseQuery(options),
}));

// Mock Contentful SDK
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page component', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('shows loading skeleton when isLoading is true', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<Page />);

    expect(screen.getByText('Loading component...')).toBeInTheDocument();
  });

  it('shows "No entries found" message when entries array is empty', () => {
    mockUseQuery.mockReturnValue({
      data: {
        entries: [],
        total: 0,
        fetchedAt: new Date(),
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<Page />);

    expect(screen.getByText('No entries found in this space.')).toBeInTheDocument();
  });

  it('shows error display when error exists', () => {
    const testError = new Error('Failed to fetch entries');
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: testError,
      refetch: mockRefetch,
    });

    render(<Page />);

    expect(screen.getByText('Error loading entries')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch entries')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', async () => {
    const testError = new Error('Failed to fetch entries');
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: testError,
      refetch: mockRefetch,
    });

    render(<Page />);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    retryButton.click();

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isFetching is true', () => {
    const mockEntries: EntryProps[] = [
      {
        sys: { id: 'entry-1', type: 'Entry' } as any,
        fields: {},
      },
    ];

    mockUseQuery.mockReturnValue({
      data: {
        entries: mockEntries,
        total: 1,
        fetchedAt: new Date(),
      },
      isLoading: false,
      isFetching: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<Page />);

    expect(screen.getByText('Loading component...')).toBeInTheDocument();
  });

  it('calls refetch when refresh button is clicked', () => {
    const mockEntries: EntryProps[] = [
      {
        sys: { id: 'entry-1', type: 'Entry' } as any,
        fields: {},
      },
    ];

    mockUseQuery.mockReturnValue({
      data: {
        entries: mockEntries,
        total: 1,
        fetchedAt: new Date(),
      },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<Page />);

    const refreshButton = screen.getByRole('button', { name: 'Refresh' });
    refreshButton.click();

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('disables refresh button when isFetching is true', () => {
    const mockEntries: EntryProps[] = [
      {
        sys: { id: 'entry-1', type: 'Entry' } as any,
        fields: {},
      },
    ];

    mockUseQuery.mockReturnValue({
      data: {
        entries: mockEntries,
        total: 1,
        fetchedAt: new Date(),
      },
      isLoading: false,
      isFetching: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<Page />);

    const refreshButton = screen.getByRole('button', { name: 'Refreshing...' });
    expect(refreshButton).toBeDisabled();
  });
});
