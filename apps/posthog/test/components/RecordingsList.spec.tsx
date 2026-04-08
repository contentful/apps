import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SessionRecording } from '../../src/types';
import { RecordingsList } from '../../src/components/RecordingsList';

describe('RecordingsList component', () => {
  const mockRecordings: SessionRecording[] = [
    {
      id: 'rec_abc123def456',
      distinctId: 'user_001',
      startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      duration: 185, // 3m 5s
      viewUrl: 'https://us.posthog.com/project/12345/replay/rec_abc123def456',
    },
    {
      id: 'rec_xyz789ghi012',
      distinctId: 'user_002',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      duration: 45,
    },
    {
      id: 'rec_jkl345mno678',
      distinctId: 'user_003',
      startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      duration: 600, // 10m
      recordingUrl: 'https://eu.posthog.com/project/54321/replay/rec_jkl345mno678',
    },
  ];

  describe('Loading state', () => {
    it('displays loading indicator when isLoading is true', () => {
      render(<RecordingsList recordings={[]} isLoading={true} error={null} />);

      expect(screen.getByTestId('recordings-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading recordings...')).toBeInTheDocument();
    });

    it('does not display recordings list when loading', () => {
      render(<RecordingsList recordings={mockRecordings} isLoading={true} error={null} />);

      expect(screen.queryByTestId('recordings-list')).toBeNull();
    });
  });

  describe('Error state', () => {
    it('displays error message when error is provided', () => {
      const errorMessage = 'Failed to fetch recordings';
      render(<RecordingsList recordings={[]} isLoading={false} error={errorMessage} />);

      expect(screen.getByTestId('recordings-error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not display recordings list when there is an error', () => {
      render(<RecordingsList recordings={mockRecordings} isLoading={false} error="Some error" />);

      expect(screen.queryByTestId('recordings-list')).toBeNull();
    });
  });

  describe('Empty state', () => {
    it('displays empty state when recordings array is empty', () => {
      render(<RecordingsList recordings={[]} isLoading={false} error={null} />);

      expect(screen.getByTestId('recordings-empty')).toBeInTheDocument();
      expect(screen.getByText('No Recordings Found')).toBeInTheDocument();
      expect(
        screen.getByText(/No session recordings have been captured for this page yet/)
      ).toBeInTheDocument();
    });
  });

  describe('Success state - displaying recordings', () => {
    it('displays recordings list when recordings are provided', () => {
      render(
        <RecordingsList
          recordings={mockRecordings}
          isLoading={false}
          error={null}
          posthogHost="us"
          projectId="12345"
        />
      );

      expect(screen.getByTestId('recordings-list')).toBeInTheDocument();
    });

    it('renders the correct number of recording items', () => {
      render(
        <RecordingsList
          recordings={mockRecordings}
          isLoading={false}
          error={null}
          posthogHost="us"
          projectId="12345"
        />
      );

      // Each recording should have a session link with truncated ID
      expect(screen.getByText(/Session rec_abc1.../)).toBeInTheDocument();
      expect(screen.getByText(/Session rec_xyz7.../)).toBeInTheDocument();
      expect(screen.getByText(/Session rec_jkl3.../)).toBeInTheDocument();
    });

    it('displays relative time for recent recordings', () => {
      render(<RecordingsList recordings={mockRecordings} isLoading={false} error={null} />);

      // 30 minutes ago should show "30m ago"
      expect(screen.getByText(/30m ago/)).toBeInTheDocument();
      // 2 hours ago should show "2h ago"
      expect(screen.getByText(/2h ago/)).toBeInTheDocument();
    });

    it('displays formatted duration', () => {
      render(<RecordingsList recordings={mockRecordings} isLoading={false} error={null} />);

      // 185 seconds = 3m 5s
      expect(screen.getByText(/3m 5s/)).toBeInTheDocument();
      // 45 seconds = 45s
      expect(screen.getByText(/45s/)).toBeInTheDocument();
      // 600 seconds = 10m
      expect(screen.getByText(/10m/)).toBeInTheDocument();
    });

    it('renders external links to PostHog recordings', () => {
      render(
        <RecordingsList
          recordings={mockRecordings}
          isLoading={false}
          error={null}
          posthogHost="us"
          projectId="12345"
        />
      );

      const links = screen.getAllByRole('link');
      expect(links.length).toBe(3);
      links.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('uses viewUrl when available', () => {
      render(<RecordingsList recordings={mockRecordings} isLoading={false} error={null} />);

      const links = screen.getAllByRole('link');
      // First recording has viewUrl
      expect(links[0]).toHaveAttribute(
        'href',
        'https://us.posthog.com/project/12345/replay/rec_abc123def456'
      );
    });

    it('uses recordingUrl when viewUrl is not available', () => {
      render(<RecordingsList recordings={mockRecordings} isLoading={false} error={null} />);

      const links = screen.getAllByRole('link');
      // Third recording has recordingUrl (not viewUrl)
      expect(links[2]).toHaveAttribute(
        'href',
        'https://eu.posthog.com/project/54321/replay/rec_jkl345mno678'
      );
    });

    it('generates URL from host and projectId when no URL is provided', () => {
      const recordingsWithoutUrls: SessionRecording[] = [
        {
          id: 'rec_no_url_123',
          distinctId: 'user_004',
          startTime: new Date().toISOString(),
          duration: 60,
        },
      ];

      render(
        <RecordingsList
          recordings={recordingsWithoutUrls}
          isLoading={false}
          error={null}
          posthogHost="eu"
          projectId="98765"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute(
        'href',
        'https://eu.posthog.com/project/98765/replay/rec_no_url_123'
      );
    });

    it('handles custom posthogHost URLs', () => {
      const recordingsWithoutUrls: SessionRecording[] = [
        {
          id: 'rec_custom_host',
          distinctId: 'user_005',
          startTime: new Date().toISOString(),
          duration: 120,
        },
      ];

      render(
        <RecordingsList
          recordings={recordingsWithoutUrls}
          isLoading={false}
          error={null}
          posthogHost="https://posthog.mycompany.com"
          projectId="11111"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute(
        'href',
        'https://posthog.mycompany.com/project/11111/replay/rec_custom_host'
      );
    });
  });

  describe('Edge cases', () => {
    it('handles single recording', () => {
      render(<RecordingsList recordings={[mockRecordings[0]]} isLoading={false} error={null} />);

      expect(screen.getByTestId('recordings-list')).toBeInTheDocument();
      expect(screen.getAllByRole('link').length).toBe(1);
    });

    it('handles very short durations (under a minute)', () => {
      const shortRecording: SessionRecording[] = [
        {
          id: 'rec_short',
          distinctId: 'user_short',
          startTime: new Date().toISOString(),
          duration: 5,
        },
      ];

      render(<RecordingsList recordings={shortRecording} isLoading={false} error={null} />);

      expect(screen.getByText(/5s/)).toBeInTheDocument();
    });

    it('handles very long durations', () => {
      const longRecording: SessionRecording[] = [
        {
          id: 'rec_long',
          distinctId: 'user_long',
          startTime: new Date().toISOString(),
          duration: 3661, // 1h 1m 1s
        },
      ];

      render(<RecordingsList recordings={longRecording} isLoading={false} error={null} />);

      // Should show 61m 1s (the component doesn't format hours separately)
      expect(screen.getByText(/61m 1s/)).toBeInTheDocument();
    });

    it('falls back to # when no URL info is available', () => {
      const noUrlRecording: SessionRecording[] = [
        {
          id: 'rec_no_info',
          distinctId: 'user_no_info',
          startTime: new Date().toISOString(),
          duration: 30,
        },
      ];

      render(
        <RecordingsList
          recordings={noUrlRecording}
          isLoading={false}
          error={null}
          // No posthogHost or projectId
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });

    it('handles recordings from "yesterday"', () => {
      const yesterdayRecording: SessionRecording[] = [
        {
          id: 'rec_yesterday',
          distinctId: 'user_yesterday',
          startTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
          duration: 100,
        },
      ];

      render(<RecordingsList recordings={yesterdayRecording} isLoading={false} error={null} />);

      expect(screen.getByText(/Yesterday/)).toBeInTheDocument();
    });

    it('handles recordings from several days ago', () => {
      const daysAgoRecording: SessionRecording[] = [
        {
          id: 'rec_days_ago',
          distinctId: 'user_days_ago',
          startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          duration: 200,
        },
      ];

      render(<RecordingsList recordings={daysAgoRecording} isLoading={false} error={null} />);

      expect(screen.getByText(/5 days ago/)).toBeInTheDocument();
    });
  });
});
