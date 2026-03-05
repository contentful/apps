import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockSdk } from '../mocks';
import { createMockRedirect, createMockRedirectForPage } from '../utils/testUtils';
import { RedirectsTable } from '../../src/components/RedirectsTable';
import { RedirectEntry } from '../../src/utils/types';
import { ITEMS_PER_PAGE } from '../../src/utils/consts';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

function renderTable(redirects: RedirectEntry[] = [createMockRedirectForPage(0)]) {
  return render(
    <RedirectsTable
      redirects={redirects}
      isFetchingRedirects={false}
      fetchingRedirectsError={null}
      refetchRedirects={vi.fn()}
      currentPage={0}
      itemsPerPage={ITEMS_PER_PAGE}
      onPageChange={vi.fn()}
      onItemsPerPageChange={vi.fn()}
    />
  );
}

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
    renderTable();

    const destinationLink = await screen.findByText('Field to title 0');
    fireEvent.click(destinationLink);

    expect((mockSdk as any).navigator.openEntry).toHaveBeenCalledWith('to-test-id-0');
  });

  it('renders type and status filters and search input', () => {
    renderTable();

    waitFor(() => {
      expect(screen.getByText('Filter by type')).toBeInTheDocument();
      expect(screen.getByText('Filter by status')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search by title, slug or reason')).toBeInTheDocument();
    });
  });

  it('updates type filter label when an option is selected', async () => {
    renderTable();

    const typeButton = await screen.findByText('Filter by type');
    fireEvent.click(typeButton);

    const permanentOption = await screen.findByText('Permanent (301)');
    fireEvent.click(permanentOption);

    expect(screen.getByTestId('type-pill-Permanent (301)')).toBeInTheDocument();
  });

  it('updates status filter label when an option is selected', async () => {
    renderTable();

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

    const mockRedirects = [permanent, temporary, permanentInactive];

    describe('search', () => {
      beforeEach(() => vi.useFakeTimers());
      afterEach(() => vi.useRealTimers());

      it('filters by source title', () => {
        renderTable(mockRedirects);

        fireEvent.change(screen.getByPlaceholderText('Search by title, slug or reason'), {
          target: { value: 'Homepage' },
        });
        act(() => vi.advanceTimersByTime(600));

        expect(screen.getByText('Homepage')).toBeInTheDocument();
        expect(screen.queryByText('Contact page')).not.toBeInTheDocument();
        expect(screen.queryByText('Blog index')).not.toBeInTheDocument();
      });

      it('filters by reason', () => {
        renderTable(mockRedirects);

        fireEvent.change(screen.getByPlaceholderText('Search by title, slug or reason'), {
          target: { value: 'Maintenance' },
        });
        act(() => vi.advanceTimersByTime(600));

        expect(screen.getByText('Contact page')).toBeInTheDocument();
        expect(screen.queryByText('Homepage')).not.toBeInTheDocument();
        expect(screen.queryByText('Blog index')).not.toBeInTheDocument();
      });

      it('shows no rows when query matches nothing', () => {
        renderTable(mockRedirects);

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
      renderTable(mockRedirects);

      fireEvent.click(await screen.findByText('Filter by type'));
      fireEvent.click(await screen.findByTestId('cf-multiselect-list-item-type-Permanent (301)'));

      await waitFor(() => {
        expect(screen.getByText('Homepage')).toBeInTheDocument();
        expect(screen.getByText('Blog index')).toBeInTheDocument();
        expect(screen.queryByText('Contact page')).not.toBeInTheDocument();
      });
    });

    it('status filter shows only active redirects', async () => {
      renderTable(mockRedirects);

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
