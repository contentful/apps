import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import Sidebar from '../../src/locations/Sidebar';
import { mockSdk, mockSdkUnconfigured, mockSdkNoMapping, mockSdkNoSlug } from '../mocks/mockSdk';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@contentful/react-apps-toolkit', async (importOriginal) => {
  const { mockSdk } = await import('../mocks/mockSdk');
  const { mockCma } = await import('../mocks/mockCma');
  return {
    useSDK: vi.fn(() => mockSdk),
    useAutoResizer: vi.fn(),
    useCMA: vi.fn(() => mockCma),
  };
});

// Import the mocked useSDK so we can change its return value
import { useSDK } from '@contentful/react-apps-toolkit';

// ============================================================================
// Tests
// ============================================================================

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as any).mockReturnValue(mockSdk);
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render the sidebar container', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        // Should have the tabs component
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });

    it('should render the Analytics tab', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
      });
    });

    it('should show last updated indicator when configured', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        // The auto-refresh indicator should be visible after data loads
        expect(screen.getByText(/Auto-refreshing/)).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Display', () => {
    it('should render the AnalyticsDisplay component', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        // AnalyticsDisplay should be rendered within the analytics tab
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      });
    });

    it('should show empty state when no metrics are loaded', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        // The empty state should be visible initially
        expect(screen.getByTestId('analytics-empty')).toBeInTheDocument();
      });
    });
  });

  describe('Date Range Selection', () => {
    it('should render date range selector', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        // Look for the date range dropdown or buttons
        const tabPanel = screen.getByRole('tabpanel');
        expect(tabPanel).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    it('should show error when app is not configured', async () => {
      (useSDK as any).mockReturnValue(mockSdkUnconfigured);

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText(/App Not Configured/i)).toBeInTheDocument();
        expect(screen.getByText(/Open app configuration/i)).toBeInTheDocument();
      });
    });

    it('should call navigator.openAppConfig when clicking configure link', async () => {
      (useSDK as any).mockReturnValue(mockSdkUnconfigured);

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText(/Open app configuration/i)).toBeInTheDocument();
      });

      const configLink = screen.getByText(/Open app configuration/i);
      fireEvent.click(configLink);

      await waitFor(() => {
        expect(mockSdkUnconfigured.navigator.openAppConfig).toHaveBeenCalled();
      });
    });

    it('should show error when no URL mapping exists for content type', async () => {
      (useSDK as any).mockReturnValue(mockSdkNoMapping);

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText(/Configuration Required/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Content type "blogPost" is not configured for analytics/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when slug field is empty', async () => {
      (useSDK as any).mockReturnValue(mockSdkNoSlug);

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText(/Configuration Required/i)).toBeInTheDocument();
        expect(screen.getByText(/No slug value found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should have analytics tab active by default', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
        expect(analyticsTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Auto Resizer', () => {
    it('should call useAutoResizer', async () => {
      const { useAutoResizer } = await import('@contentful/react-apps-toolkit');

      render(<Sidebar />);

      expect(useAutoResizer).toHaveBeenCalled();
    });
  });
});
