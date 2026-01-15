import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import { ReleasesTable } from '../../src/components/ReleasesTable';
import { QueryProvider } from '../../src/providers/QueryProvider';
import type { ReleaseWithScheduledAction } from '../../src/utils/fetchReleases';
import userEvent from '@testing-library/user-event';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const mockRefetch = vi.fn();

const mockUseReleases = vi.fn();

vi.mock('../../src/hooks/useReleases', () => ({
  useReleases: (page: number) => mockUseReleases(page),
}));

const createMockRelease = (
  overrides?: Partial<ReleaseWithScheduledAction>
): ReleaseWithScheduledAction => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  return {
    releaseId: 'release-1',
    scheduledActionId: 'action-1',
    title: 'Test Release',
    scheduledFor: {
      datetime: futureDate.toISOString(),
      timezone: 'UTC',
    },
    action: 'publish',
    itemsCount: 5,
    updatedAt: now.toISOString(),
    updatedBy: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
    },
    viewUrl: 'https://app.contentful.com/spaces/test/releases/release-1',
    ...overrides,
  };
};

const createWrapper = () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryProvider>{children}</QueryProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('ReleasesTable component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockClear();
    // Mock window.open
    window.open = vi.fn();
  });

  describe('Loading state', () => {
    it('renders skeleton loader when fetching releases', () => {
      mockUseReleases.mockReturnValue({
        releases: [],
        total: 0,
        isFetchingReleases: true,
        fetchingReleasesError: null,
        refetch: mockRefetch,
      });

      render(<ReleasesTable />, { wrapper: createWrapper() });

      expect(screen.getByRole('table')).toBeInTheDocument();
      // Skeleton rows should be present
      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('displays error message when fetching fails', () => {
      mockUseReleases.mockReturnValue({
        releases: [],
        total: 0,
        isFetchingReleases: false,
        fetchingReleasesError: new Error('Failed to fetch releases'),
        refetch: mockRefetch,
      });

      render(<ReleasesTable />, { wrapper: createWrapper() });

      expect(screen.getByText('Failed to load releases')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('displays empty state message when no releases are scheduled', () => {
      mockUseReleases.mockReturnValue({
        releases: [],
        total: 0,
        isFetchingReleases: false,
        fetchingReleasesError: null,
        refetch: mockRefetch,
      });

      render(<ReleasesTable />, { wrapper: createWrapper() });

      expect(screen.getByText('No scheduled releases')).toBeInTheDocument();
      expect(
        screen.getByText('Releases will appear here when they are scheduled.')
      ).toBeInTheDocument();
    });
  });

  describe('Table rendering', () => {
    it('renders release data in table rows', () => {
      const mockReleases = [
        createMockRelease({
          releaseId: 'release-1',
          title: 'My First Release',
          itemsCount: 10,
        }),
      ];
      mockUseReleases.mockReturnValue({
        releases: mockReleases,
        total: 1,
        isFetchingReleases: false,
        fetchingReleasesError: null,
        refetch: mockRefetch,
      });

      render(<ReleasesTable />, { wrapper: createWrapper() });

      expect(screen.getByText('My First Release')).toBeInTheDocument();
      expect(screen.getByText('10 items')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders multiple releases', () => {
      const mockReleases = [
        createMockRelease({ releaseId: 'release-1', title: 'Release 1' }),
        createMockRelease({ releaseId: 'release-2', title: 'Release 2' }),
        createMockRelease({ releaseId: 'release-3', title: 'Release 3' }),
      ];
      mockUseReleases.mockReturnValue({
        releases: mockReleases,
        total: 3,
        isFetchingReleases: false,
        fetchingReleasesError: null,
        refetch: mockRefetch,
      });

      render(<ReleasesTable />, { wrapper: createWrapper() });

      expect(screen.getByText('Release 1')).toBeInTheDocument();
      expect(screen.getByText('Release 2')).toBeInTheDocument();
      expect(screen.getByText('Release 3')).toBeInTheDocument();
    });
  });

  describe('Menu actions', () => {
    it('opens view release in new window when clicking view release', async () => {
      const user = userEvent.setup();
      const mockRelease = createMockRelease({
        viewUrl: 'https://app.contentful.com/releases/123',
      });
      mockUseReleases.mockReturnValue({
        releases: [mockRelease],
        total: 1,
        isFetchingReleases: false,
        fetchingReleasesError: null,
        refetch: mockRefetch,
      });

      render(<ReleasesTable />, { wrapper: createWrapper() });

      // Find and click the menu trigger
      const menuButtons = screen.getAllByLabelText('toggle menu');
      await user.click(menuButtons[0]);

      // Click "View release"
      const viewReleaseButton = screen.getByText('View release');
      await user.click(viewReleaseButton);

      expect(window.open).toHaveBeenCalledWith(
        'https://app.contentful.com/releases/123',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Modal interactions', () => {
    it('opens reschedule modal when reschedule button is clicked', async () => {
      const user = userEvent.setup();
      const mockRelease = createMockRelease();
      mockUseReleases.mockReturnValue({
        releases: [mockRelease],
        total: 1,
        isFetchingReleases: false,
        fetchingReleasesError: null,
        refetch: mockRefetch,
      });

      render(<ReleasesTable />, { wrapper: createWrapper() });

      const menuButtons = screen.getAllByLabelText('toggle menu');
      await user.click(menuButtons[0]);

      const rescheduleButton = await screen.findByText('Reschedule release');
      await user.click(rescheduleButton);

      const modal = await screen.findByTestId('reschedule-modal', {}, { timeout: 2000 });
      expect(modal).toBeInTheDocument();
    });

    it('closes unschedule modal when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockRelease = createMockRelease();
      mockUseReleases.mockReturnValue({
        releases: [mockRelease],
        total: 1,
        isFetchingReleases: false,
        fetchingReleasesError: null,
        refetch: mockRefetch,
      });

      render(<ReleasesTable />, { wrapper: createWrapper() });

      const menuButtons = screen.getAllByLabelText('toggle menu');
      await user.click(menuButtons[0]);

      const unscheduleButton = await screen.findByText('Unschedule release');
      await user.click(unscheduleButton);

      const modal = await screen.findByTestId('unschedule-modal', {}, { timeout: 2000 });
      expect(modal).toBeInTheDocument();

      const closeButton = screen.getByText('No, keep scheduled');
      await user.click(closeButton);

      await waitFor(
        () => {
          expect(screen.queryByTestId('unschedule-modal')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });
});
