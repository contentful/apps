import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockSdk } from '../mocks';
import { createMockRedirect, createMockRedirectForPage } from '../utils/testUtils';
import { RedirectsTable } from '../../src/components/RedirectsTable';
import { EntryProps } from 'contentful-management';

let mockRedirects: EntryProps[] = [createMockRedirectForPage(0) as EntryProps];

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('../../src/hooks/useRedirects', () => ({
  useRedirects: () => ({
    redirects: mockRedirects,
    total: mockRedirects.length,
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

  describe('client-side filtering', () => {
    const permanent = createMockRedirect('r1', {
      fromTitle: 'Homepage',
      reason: 'SEO update',
      type: 'Permanent (301)',
      active: true,
    });
    const temporary = createMockRedirect('r2', {
      fromTitle: 'Contact page',
      reason: 'Maintenance window',
      type: 'Temporary (302)',
      active: false,
    });
    const permanentInactive = createMockRedirect('r3', {
      fromTitle: 'Blog index',
      reason: 'Restructuring',
      type: 'Permanent (301)',
      active: false,
    });

    beforeEach(() => {
      mockRedirects = [permanent, temporary, permanentInactive];
    });

    afterEach(() => {
      mockRedirects = [createMockRedirectForPage(0) as EntryProps];
    });

    describe('search', () => {
      beforeEach(() => vi.useFakeTimers());
      afterEach(() => vi.useRealTimers());

      it('filters by source title', () => {
        render(<RedirectsTable />);

        fireEvent.change(screen.getByPlaceholderText('Search by title, slug or reason'), {
          target: { value: 'Homepage' },
        });
        act(() => vi.advanceTimersByTime(600));

        expect(screen.getByText('Homepage')).toBeInTheDocument();
        expect(screen.queryByText('Contact page')).not.toBeInTheDocument();
        expect(screen.queryByText('Blog index')).not.toBeInTheDocument();
      });

      it('filters by reason', () => {
        render(<RedirectsTable />);

        fireEvent.change(screen.getByPlaceholderText('Search by title, slug or reason'), {
          target: { value: 'Maintenance' },
        });
        act(() => vi.advanceTimersByTime(600));

        expect(screen.getByText('Contact page')).toBeInTheDocument();
        expect(screen.queryByText('Homepage')).not.toBeInTheDocument();
        expect(screen.queryByText('Blog index')).not.toBeInTheDocument();
      });

      it('shows no rows when query matches nothing', () => {
        render(<RedirectsTable />);

        fireEvent.change(screen.getByPlaceholderText('Search by title, slug or reason'), {
          target: { value: 'xyznonexistent' },
        });
        act(() => vi.advanceTimersByTime(600));

        expect(screen.queryByText('Homepage')).not.toBeInTheDocument();
        expect(screen.queryByText('Contact page')).not.toBeInTheDocument();
        expect(screen.queryByText('Blog index')).not.toBeInTheDocument();
      });
    });

    it('type filter shows only redirects with matching type', async () => {
      render(<RedirectsTable />);

      fireEvent.click(await screen.findByText('Filter by type'));
      fireEvent.click(await screen.findByTestId('cf-multiselect-list-item-type-Permanent (301)'));

      await waitFor(() => {
        expect(screen.getByText('Homepage')).toBeInTheDocument();
        expect(screen.getByText('Blog index')).toBeInTheDocument();
        expect(screen.queryByText('Contact page')).not.toBeInTheDocument();
      });
    });

    it('status filter shows only active redirects', async () => {
      render(<RedirectsTable />);

      fireEvent.click(await screen.findByText('Filter by status'));
      fireEvent.click(await screen.findByTestId('cf-multiselect-list-item-type-Active'));

      await waitFor(() => {
        expect(screen.getByText('Homepage')).toBeInTheDocument();
        expect(screen.queryByText('Contact page')).not.toBeInTheDocument();
        expect(screen.queryByText('Blog index')).not.toBeInTheDocument();
      });
    });
  });
});
