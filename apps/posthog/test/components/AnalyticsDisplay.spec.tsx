import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AnalyticsMetrics, DateRange } from '../../src/types';
import { AnalyticsDisplay, formatDuration } from '../../src/components/AnalyticsDisplay';

describe('AnalyticsDisplay component', () => {
  const mockMetrics: AnalyticsMetrics = {
    pageViews: 1234,
    uniqueVisitors: 567,
    avgSessionDuration: 185, // 3m 5s
    dateRange: 'last7days',
    pageUrl: 'https://example.com/blog/my-post',
  };

  describe('Loading state', () => {
    it('displays loading indicator when isLoading is true', () => {
      render(
        <AnalyticsDisplay
          metrics={null}
          isLoading={true}
          error={null}
          dateRange="last7days"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('analytics-loading')).toBeTruthy();
      expect(screen.getByText('Loading analytics...')).toBeTruthy();
    });

    it('does not display metrics when loading', () => {
      render(
        <AnalyticsDisplay
          metrics={mockMetrics}
          isLoading={true}
          error={null}
          dateRange="last7days"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.queryByTestId('analytics-display')).toBeNull();
    });
  });

  describe('Error state', () => {
    it('displays error message when error is provided', () => {
      const errorMessage = 'Failed to fetch analytics data';
      render(
        <AnalyticsDisplay
          metrics={null}
          isLoading={false}
          error={errorMessage}
          dateRange="last7days"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('analytics-error')).toBeTruthy();
      expect(screen.getByText(errorMessage)).toBeTruthy();
    });

    it('does not display metrics when there is an error', () => {
      render(
        <AnalyticsDisplay
          metrics={mockMetrics}
          isLoading={false}
          error="Some error"
          dateRange="last7days"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.queryByTestId('analytics-display')).toBeNull();
    });
  });

  describe('Empty state', () => {
    it('displays empty state when metrics is null', () => {
      render(
        <AnalyticsDisplay
          metrics={null}
          isLoading={false}
          error={null}
          dateRange="last7days"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('analytics-empty')).toBeTruthy();
      expect(screen.getByText('No analytics data available')).toBeTruthy();
    });
  });

  describe('Success state - displaying metrics', () => {
    it('displays page views count', () => {
      render(
        <AnalyticsDisplay
          metrics={mockMetrics}
          isLoading={false}
          error={null}
          dateRange="last7days"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('analytics-page-views')).toBeTruthy();
      expect(screen.getByText('1234')).toBeTruthy();
    });

    it('displays unique visitors count', () => {
      render(
        <AnalyticsDisplay
          metrics={mockMetrics}
          isLoading={false}
          error={null}
          dateRange="last7days"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('analytics-unique-visitors')).toBeTruthy();
      expect(screen.getByText('567')).toBeTruthy();
    });

    it('displays average session duration in human-readable format', () => {
      render(
        <AnalyticsDisplay
          metrics={mockMetrics}
          isLoading={false}
          error={null}
          dateRange="last7days"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('analytics-avg-duration')).toBeTruthy();
      // 185 seconds = 3m 5s
      expect(screen.getByText('3m 5s')).toBeTruthy();
    });

    it('displays duration in seconds when under a minute', () => {
      const shortDurationMetrics = { ...mockMetrics, avgSessionDuration: 45 };
      render(
        <AnalyticsDisplay
          metrics={shortDurationMetrics}
          isLoading={false}
          error={null}
          dateRange="last7days"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.getByText('45s')).toBeTruthy();
    });
  });

  describe('Date range selector', () => {
    it('displays date range selector with current value', () => {
      render(
        <AnalyticsDisplay
          metrics={mockMetrics}
          isLoading={false}
          error={null}
          dateRange="last7days"
          onDateRangeChange={vi.fn()}
        />
      );

      // Forma 36 Select uses id attribute, not data-testid
      const selector = document.getElementById('date-range-selector') as HTMLSelectElement;
      expect(selector).toBeTruthy();
      expect(selector.value).toBe('last7days');
    });

    it('calls onDateRangeChange when date range is changed', async () => {
      const onDateRangeChange = vi.fn();
      render(
        <AnalyticsDisplay
          metrics={mockMetrics}
          isLoading={false}
          error={null}
          dateRange="last7days"
          onDateRangeChange={onDateRangeChange}
        />
      );

      // Forma 36 Select uses id attribute
      const selector = document.getElementById('date-range-selector') as HTMLSelectElement;
      expect(selector).toBeTruthy();
      // Trigger change with a new value
      selector.value = 'last30days';
      selector.dispatchEvent(new Event('change', { bubbles: true }));

      expect(onDateRangeChange).toHaveBeenCalledWith('last30days');
    });

    it('displays all date range options', () => {
      render(
        <AnalyticsDisplay
          metrics={mockMetrics}
          isLoading={false}
          error={null}
          dateRange="today"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.getByText('Today')).toBeTruthy();
      expect(screen.getByText('Last 7 days')).toBeTruthy();
      expect(screen.getByText('Last 30 days')).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('handles zero metrics gracefully', () => {
      const zeroMetrics: AnalyticsMetrics = {
        pageViews: 0,
        uniqueVisitors: 0,
        avgSessionDuration: 0,
        dateRange: 'today',
        pageUrl: 'https://example.com/blog/new-post',
      };

      render(
        <AnalyticsDisplay
          metrics={zeroMetrics}
          isLoading={false}
          error={null}
          dateRange="today"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.getByTestId('analytics-display')).toBeTruthy();
      expect(screen.getByTestId('analytics-page-views').textContent).toBe('0');
      expect(screen.getByTestId('analytics-unique-visitors').textContent).toBe('0');
    });

    it('handles large numbers', () => {
      const largeMetrics: AnalyticsMetrics = {
        pageViews: 1234567,
        uniqueVisitors: 987654,
        avgSessionDuration: 3600, // 1 hour
        dateRange: 'last30days',
        pageUrl: 'https://example.com/popular-page',
      };

      render(
        <AnalyticsDisplay
          metrics={largeMetrics}
          isLoading={false}
          error={null}
          dateRange="last30days"
          onDateRangeChange={vi.fn()}
        />
      );

      expect(screen.getByText('1234567')).toBeTruthy();
      expect(screen.getByText('987654')).toBeTruthy();
    });
  });
});
