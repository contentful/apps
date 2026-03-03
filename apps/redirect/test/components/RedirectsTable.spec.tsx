import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockSdk } from '../mocks';
import { createMockRedirectForPage } from '../utils/testUtils';
import { RedirectsTable } from '../../src/components/RedirectsTable';
import { EntryProps } from 'contentful-management';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('../../src/hooks/useRedirects', () => ({
  useRedirects: () => ({
    redirects: [createMockRedirectForPage(0) as EntryProps],
    total: 1,
    isFetchingRedirects: false,
    fetchingRedirectsError: null,
    refetchRedirects: vi.fn(),
    fetchedAt: new Date(),
  }),
}));

describe('RedirectsTable component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockSdk as any).navigator = {
      ...(mockSdk as any).navigator,
      openEntry: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('calls sdk.navigator.openEntry with destination entry ID when clicking destination link', async () => {
    render(<RedirectsTable />);

    const destinationLink = await screen.findByText('Field to title 0');
    fireEvent.click(destinationLink);

    expect((mockSdk as any).navigator.openEntry).toHaveBeenCalledWith('to-test-id-0');
  });

  it('renders type and status filters and search input', () => {
    render(<RedirectsTable />);

    waitFor(() => {
      expect(screen.getByText('Filter by type')).toBeInTheDocument();
      expect(screen.getByText('Filter by status')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search by title, slug or reason')).toBeInTheDocument();
    });
  });

  it('updates type filter label when an option is selected', async () => {
    render(<RedirectsTable />);

    const typeButton = await screen.findByText('Filter by type');
    fireEvent.click(typeButton);

    const permanentOption = await screen.findByText('Permanent (301)');
    fireEvent.click(permanentOption);

    expect(screen.getByTestId('type-pill-Permanent (301)')).toBeInTheDocument();
  });

  it('updates status filter label when an option is selected', async () => {
    render(<RedirectsTable />);

    const statusButton = await screen.findByText('Filter by status');
    fireEvent.click(statusButton);

    const activeOption = screen.getByText('Active');
    fireEvent.click(activeOption);

    expect(screen.getByTestId('status-pill-Active')).toBeInTheDocument();
  });
});
