import { Spinner, Note } from '@contentful/f36-components';
import type { AnalyticsMetrics, DateRange } from '../types';
import { DateRangeSelector } from './DateRangeSelector';
import { styles } from '../locations/Sidebar.styles';

export interface AnalyticsDisplayProps {
  /** Analytics metrics data, or null if not loaded */
  metrics: AnalyticsMetrics | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message, or null if no error */
  error: string | null;
  /** Currently selected date range */
  dateRange: DateRange;
  /** Callback when date range changes */
  onDateRangeChange: (dateRange: DateRange) => void;
}

/**
 * Formats duration in seconds to human-readable format.
 * @param seconds - Duration in seconds
 * @returns Formatted string like "3m 5s" or "45s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Formats large numbers with locale-specific separators.
 * @param value - Number to format
 * @returns Formatted string
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Displays analytics metrics for a page with date range selection.
 * Handles loading, error, and empty states.
 */
export function AnalyticsDisplay({
  metrics,
  isLoading,
  error,
  dateRange,
  onDateRangeChange,
}: AnalyticsDisplayProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer} data-testid="analytics-loading">
        <Spinner size="large" />
        <p className={styles.loadingText}>Loading analytics...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer} data-testid="analytics-error">
        <Note variant="negative">{error}</Note>
      </div>
    );
  }

  // Empty state
  if (!metrics) {
    return (
      <div className={styles.emptyState} data-testid="analytics-empty">
        <p className={styles.emptyStateTitle}>No analytics data available</p>
        <p className={styles.emptyStateText}>
          Analytics will appear here once your content receives traffic.
        </p>
      </div>
    );
  }

  // Success state - display metrics
  return (
    <div data-testid="analytics-display" role="region" aria-label="Analytics metrics for this page">
      {/* Date Range Selector */}
      <div className={styles.dateRangeContainer}>
        <DateRangeSelector value={dateRange} onChange={onDateRangeChange} hideLabel />
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid} role="list" aria-label="Analytics metrics">
        {/* Page Views */}
        <div className={styles.metricCard} role="listitem">
          <div
            className={styles.metricValue}
            data-testid="analytics-page-views"
            aria-label={`${metrics.pageViews} page views`}>
            {metrics.pageViews}
          </div>
          <p className={styles.metricLabel} id="page-views-label">
            Page Views
          </p>
        </div>

        {/* Unique Visitors */}
        <div className={styles.metricCard} role="listitem">
          <div
            className={styles.metricValue}
            data-testid="analytics-unique-visitors"
            aria-label={`${metrics.uniqueVisitors} unique visitors`}>
            {metrics.uniqueVisitors}
          </div>
          <p className={styles.metricLabel} id="unique-visitors-label">
            Unique Visitors
          </p>
        </div>

        {/* Average Session Duration - Full width */}
        <div className={styles.metricCardFull} role="listitem">
          <div
            className={styles.metricValue}
            data-testid="analytics-avg-duration"
            aria-label={`Average session duration: ${formatDuration(metrics.avgSessionDuration)}`}>
            {formatDuration(metrics.avgSessionDuration)}
          </div>
          <p className={styles.metricLabel} id="avg-duration-label">
            Avg. Session Duration
          </p>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDisplay;
