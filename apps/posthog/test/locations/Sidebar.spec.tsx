import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import Sidebar from '../../src/locations/Sidebar';
import { useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import { mockSdk, mockSdkUnconfigured, mockSdkNoMapping, mockSdkNoSlug } from '../mocks/mockSdk';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(() => mockSdk),
  useAutoResizer: vi.fn(),
}));

// Mock Forma 36 icons to avoid rendering issues
vi.mock('@contentful/f36-icons', () => ({
  ExternalLinkIcon: ({ size }: { size?: string }) => (
    <span data-testid="external-link-icon" data-size={size} />
  ),
  ClockIcon: ({ size }: { size?: string }) => <span data-testid="clock-icon" data-size={size} />,
  UsersIcon: ({ size }: { size?: string }) => <span data-testid="users-icon" data-size={size} />,
  EyeIcon: ({ size }: { size?: string }) => <span data-testid="eye-icon" data-size={size} />,
  CycleIcon: ({ className }: { className?: string }) => (
    <span data-testid="cycle-icon" className={className} />
  ),
}));

// Mock the PostHog client
const mockGetEntryStats = vi.fn();
const mockGetDailyStats = vi.fn();
const mockGetRecentRecordings = vi.fn();
const mockGetInsightsDeepLink = vi.fn();
const mockGetRecordingsDeepLink = vi.fn();
const mockClearCache = vi.fn();

vi.mock('../../src/lib/posthog', () => ({
  createPostHogClient: vi.fn(() => ({
    getEntryStats: mockGetEntryStats,
    getDailyStats: mockGetDailyStats,
    getRecentRecordings: mockGetRecentRecordings,
    getInsightsDeepLink: mockGetInsightsDeepLink,
    getRecordingsDeepLink: mockGetRecordingsDeepLink,
    clearCache: mockClearCache,
  })),
  PostHogApiError: class PostHogApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
    isAuthError() {
      return this.status === 401 || this.status === 403;
    }
    isRateLimited() {
      return this.status === 429;
    }
  },
}));

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// ============================================================================
// Test Data
// ============================================================================

const mockStats = {
  pageviews: 1500,
  uniqueUsers: 750,
};

const mockDailyStats = [
  { date: '2026-01-06', pageviews: 200, uniqueUsers: 100 },
  { date: '2026-01-07', pageviews: 220, uniqueUsers: 110 },
  { date: '2026-01-08', pageviews: 180, uniqueUsers: 90 },
  { date: '2026-01-09', pageviews: 250, uniqueUsers: 125 },
  { date: '2026-01-10', pageviews: 230, uniqueUsers: 115 },
  { date: '2026-01-11', pageviews: 200, uniqueUsers: 100 },
  { date: '2026-01-12', pageviews: 220, uniqueUsers: 110 },
];

const mockRecordings = [
  {
    id: 'rec_123',
    distinctId: 'user_a...f456',
    duration: 125,
    startTime: '2026-01-12T10:30:00Z',
    recordingUrl: 'https://us.posthog.com/project/12345/replay/rec_123',
  },
  {
    id: 'rec_456',
    distinctId: 'user_x...z789',
    duration: 300,
    startTime: '2026-01-12T09:15:00Z',
    recordingUrl: 'https://us.posthog.com/project/12345/replay/rec_456',
  },
];

// ============================================================================
// Tests
// ============================================================================

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock responses
    mockGetEntryStats.mockResolvedValue(mockStats);
    mockGetDailyStats.mockResolvedValue(mockDailyStats);
    mockGetRecentRecordings.mockResolvedValue(mockRecordings);
    mockGetInsightsDeepLink.mockReturnValue('https://us.posthog.com/insights');
    mockGetRecordingsDeepLink.mockReturnValue('https://us.posthog.com/replay');

    (useSDK as any).mockReturnValue(mockSdk);
  });

  afterEach(() => {
    cleanup();
  });

  describe('Stats display', () => {
    it('should display page views and unique users', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('1.5K')).toBeInTheDocument();
        expect(screen.getByText('750')).toBeInTheDocument();
      });
    });

    it('should format numbers correctly', async () => {
      // The default mock returns 1500 pageviews and 750 users
      // 1500 should be formatted as "1.5K"
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('1.5K')).toBeInTheDocument();
        expect(screen.getByText('750')).toBeInTheDocument();
      });
    });
  });

  describe('Chart', () => {
    it('should render the traffic chart container', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        // The chart is rendered - check for the chart title in the chart container
        const chartTitles = screen.getAllByText('Last 7 days');
        expect(chartTitles.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show "View in PostHog" link', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('View in PostHog')).toBeInTheDocument();
      });
    });
  });

  describe('Session recordings', () => {
    it('should display session recordings table', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('Session Replays')).toBeInTheDocument();
        expect(screen.getByText('user_a...f456')).toBeInTheDocument();
        expect(screen.getByText('user_x...z789')).toBeInTheDocument();
      });
    });

    it('should display Watch buttons for recordings', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        const watchButtons = screen.getAllByText('Watch');
        expect(watchButtons).toHaveLength(2);
      });
    });

    it('should show "View all recordings" link', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('View all recordings')).toBeInTheDocument();
      });
    });

    it('should show message when no recordings exist', async () => {
      mockGetRecentRecordings.mockResolvedValue([]);

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('No recent session recordings found')).toBeInTheDocument();
      });
    });
  });

  describe('Date range selector', () => {
    it('should render date range dropdown', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should have all date range options', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Check that the select has the expected options
      const select = screen.getByRole('combobox');
      expect(select.querySelector('option[value="last24h"]')).toBeInTheDocument();
      expect(select.querySelector('option[value="last7d"]')).toBeInTheDocument();
      expect(select.querySelector('option[value="last14d"]')).toBeInTheDocument();
      expect(select.querySelector('option[value="last30d"]')).toBeInTheDocument();
    });

    it('should refetch data when date range changes', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(mockGetEntryStats).toHaveBeenCalled();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'last30d' } });

      await waitFor(() => {
        expect(mockGetEntryStats).toHaveBeenCalledWith(
          'hello-world',
          'https://example.com/blog/{slug}',
          'last30d'
        );
      });
    });
  });

  describe('Refresh functionality', () => {
    it('should have a refresh button', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByLabelText('Refresh data')).toBeInTheDocument();
      });
    });

    it('should clear cache and refetch on refresh', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(mockGetEntryStats).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByLabelText('Refresh data');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockClearCache).toHaveBeenCalled();
        expect(mockGetEntryStats).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error states', () => {
    it('should show error when app is not configured', async () => {
      (useSDK as any).mockReturnValue(mockSdkUnconfigured);

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText(/PostHog app is not configured/i)).toBeInTheDocument();
        expect(screen.getByText('Open app configuration')).toBeInTheDocument();
      });
    });

    it('should show error when no URL mapping exists for content type', async () => {
      (useSDK as any).mockReturnValue(mockSdkNoMapping);

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText(/No URL mapping configured/i)).toBeInTheDocument();
      });
    });

    it('should show error when slug field is empty', async () => {
      (useSDK as any).mockReturnValue(mockSdkNoSlug);

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText(/Could not determine entry slug/i)).toBeInTheDocument();
      });
    });

    it('should show error on API failure', async () => {
      const { PostHogApiError } = await import('../../src/lib/posthog');
      mockGetEntryStats.mockRejectedValue(new PostHogApiError('API Error', 500));

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument();
      });
    });

    it('should show auth error message on 401', async () => {
      const { PostHogApiError } = await import('../../src/lib/posthog');
      mockGetEntryStats.mockRejectedValue(new PostHogApiError('Unauthorized', 401));

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no data exists', async () => {
      mockGetEntryStats.mockResolvedValue({
        pageviews: 0,
        uniqueUsers: 0,
      });

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('No Analytics Data')).toBeInTheDocument();
        expect(screen.getByText(/No page views have been recorded/i)).toBeInTheDocument();
      });
    });
  });

  describe('PostHog dashboard link', () => {
    it('should show link to PostHog dashboard', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('Open PostHog')).toBeInTheDocument();
      });
    });
  });
});
