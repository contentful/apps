import { describe, expect, it } from 'vitest';
import { MetricsCalculator } from '../../src/metrics/MetricsCalculator';
import type { EntryProps, ScheduledActionProps } from 'contentful-management';
import { ScheduledActionStatus } from 'contentful-management';
import {
  NEEDS_UPDATE_MONTHS_RANGE,
  RECENTLY_PUBLISHED_DAYS_RANGE,
  TIME_TO_PUBLISH_DAYS_RANGE,
} from '../../src/utils/consts';

describe('MetricsCalculator', () => {
  const now = new Date();
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const daysFromNow = (days: number) =>
    new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  describe('constructor', () => {
    it('initializes with empty arrays', () => {
      const calculator = new MetricsCalculator([], []);

      expect(calculator.metrics).toHaveLength(5);
    });

    it('uses default values when options are not provided', () => {
      const calculator = new MetricsCalculator([], []);
      const needsUpdateMetric = calculator.metrics.find((m) => m.title === 'Needs Update');
      const recentlyPublishedMetric = calculator.metrics.find(
        (m) => m.title === 'Recently Published'
      );
      const avgTimeMetric = calculator.metrics.find((m) => m.title === 'Average Time to Publish');

      expect(needsUpdateMetric?.subtitle).toContain(`${NEEDS_UPDATE_MONTHS_RANGE.min} months`);
      expect(recentlyPublishedMetric?.subtitle).toContain(
        `${RECENTLY_PUBLISHED_DAYS_RANGE.min} days`
      );
      expect(avgTimeMetric?.subtitle).toContain(`${TIME_TO_PUBLISH_DAYS_RANGE.min} days`);
    });

    it('uses provided options', () => {
      const calculator = new MetricsCalculator([], [], {
        needsUpdateMonths: 12,
        recentlyPublishedDays: 14,
        timeToPublishDays: 60,
      });
      const needsUpdateMetric = calculator.metrics.find((m) => m.title === 'Needs Update');
      const recentlyPublishedMetric = calculator.metrics.find(
        (m) => m.title === 'Recently Published'
      );
      const avgTimeMetric = calculator.metrics.find((m) => m.title === 'Average Time to Publish');

      expect(needsUpdateMetric?.subtitle).toContain('12 months');
      expect(recentlyPublishedMetric?.subtitle).toContain('14 days');
      expect(avgTimeMetric?.subtitle).toContain('60 days');
    });
  });

  describe('calculateTotalPublished', () => {
    it('counts entries published in the last 30 days', () => {
      const entries: EntryProps[] = [
        { sys: { publishedAt: daysAgo(10) } } as EntryProps,
        { sys: { publishedAt: daysAgo(20) } } as EntryProps,
        { sys: { publishedAt: daysAgo(40) } } as EntryProps, // Outside window
      ];

      const calculator = new MetricsCalculator(entries, []);
      const metric = calculator.metrics.find((m) => m.title === 'Total Published');

      expect(metric?.value).toBe('2');
    });

    it('calculates MoM percentage change correctly', () => {
      const entries: EntryProps[] = [
        { sys: { publishedAt: daysAgo(10) } } as EntryProps, // Current period
        { sys: { publishedAt: daysAgo(40) } } as EntryProps, // Previous period
      ];

      const calculator = new MetricsCalculator(entries, []);
      const metric = calculator.metrics.find((m) => m.title === 'Total Published');

      expect(metric?.subtitle).toContain('% publishing');
    });

    it('handles zero previous period', () => {
      const entries: EntryProps[] = [{ sys: { publishedAt: daysAgo(10) } } as EntryProps];

      const calculator = new MetricsCalculator(entries, []);
      const metric = calculator.metrics.find((m) => m.title === 'Total Published');

      expect(metric?.subtitle).toContain('New publishing this month');
    });

    it('handles zero current and previous period', () => {
      const entries: EntryProps[] = [
        { sys: { publishedAt: daysAgo(100) } } as EntryProps, // Outside both periods
      ];

      const calculator = new MetricsCalculator(entries, []);
      const metric = calculator.metrics.find((m) => m.title === 'Total Published');

      expect(metric?.value).toBe('0');
      expect(metric?.subtitle).toContain('0.0% publishing change MoM');
    });
  });

  describe('calculateAverageTimeToPublish', () => {
    it('calculates average time to publish correctly', () => {
      const entries: EntryProps[] = [
        {
          sys: {
            createdAt: daysAgo(20),
            publishedAt: daysAgo(10), // 10 days to publish
          },
        } as EntryProps,
        {
          sys: {
            createdAt: daysAgo(15),
            publishedAt: daysAgo(10), // 5 days to publish
          },
        } as EntryProps,
      ];

      const calculator = new MetricsCalculator(entries, [], {
        timeToPublishDays: 30,
      });
      const metric = calculator.metrics.find((m) => m.title === 'Average Time to Publish');

      expect(metric?.value).toBe('7.5 days');
    });

    it('returns dash when no entries published in period', () => {
      const entries: EntryProps[] = [
        {
          sys: {
            createdAt: daysAgo(50),
            publishedAt: daysAgo(40), // Outside period
          },
        } as EntryProps,
      ];

      const calculator = new MetricsCalculator(entries, [], {
        timeToPublishDays: 30,
      });
      const metric = calculator.metrics.find((m) => m.title === 'Average Time to Publish');

      expect(metric?.value).toBe('—');
      expect(metric?.subtitle).toContain('No entries published');
    });
  });

  describe('calculateScheduled', () => {
    it('counts scheduled actions in next 30 days', () => {
      const scheduledActions: ScheduledActionProps[] = [
        {
          scheduledFor: { datetime: daysFromNow(5), timezone: 'UTC' },
          sys: { status: ScheduledActionStatus.scheduled },
        } as ScheduledActionProps,
        {
          scheduledFor: { datetime: daysFromNow(20), timezone: 'UTC' },
          sys: { status: ScheduledActionStatus.scheduled },
        } as ScheduledActionProps,
        {
          scheduledFor: { datetime: daysFromNow(45), timezone: 'UTC' }, // Outside window
          sys: { status: ScheduledActionStatus.scheduled },
        } as ScheduledActionProps,
      ];

      const calculator = new MetricsCalculator([], scheduledActions);
      const metric = calculator.metrics.find((m) => m.title === 'Scheduled');

      expect(metric?.value).toBe('2');
    });

    it('ignores non-scheduled actions', () => {
      const scheduledActions: ScheduledActionProps[] = [
        {
          scheduledFor: { datetime: daysFromNow(5), timezone: 'UTC' },
          sys: { status: ScheduledActionStatus.scheduled },
        } as ScheduledActionProps,
        {
          scheduledFor: { datetime: daysFromNow(10), timezone: 'UTC' },
          sys: { status: 'cancelled' },
        } as unknown as ScheduledActionProps,
      ];

      const calculator = new MetricsCalculator([], scheduledActions);
      const metric = calculator.metrics.find((m) => m.title === 'Scheduled');

      expect(metric?.value).toBe('1');
    });
  });

  describe('calculateRecentlyPublished', () => {
    it('counts entries published in the specified days', () => {
      const entries: EntryProps[] = [
        { sys: { publishedAt: daysAgo(3) } } as EntryProps,
        { sys: { publishedAt: daysAgo(5) } } as EntryProps,
        { sys: { publishedAt: daysAgo(10) } } as EntryProps, // Outside 7 day window
      ];

      const calculator = new MetricsCalculator(entries, [], {
        recentlyPublishedDays: 7,
      });
      const metric = calculator.metrics.find((m) => m.title === 'Recently Published');

      expect(metric?.value).toBe('2');
      expect(metric?.subtitle).toContain('7 days');
    });

    it('uses custom recentlyPublishedDays', () => {
      const entries: EntryProps[] = [
        { sys: { publishedAt: daysAgo(10) } } as EntryProps, // Within 14 day window
      ];

      const calculator = new MetricsCalculator(entries, [], {
        recentlyPublishedDays: 14,
      });
      const metric = calculator.metrics.find((m) => m.title === 'Recently Published');

      expect(metric?.value).toBe('1');
      expect(metric?.subtitle).toContain('14 days');
    });
  });

  describe('calculateNeedsUpdate', () => {
    it('counts entries older than specified months', () => {
      const entries: EntryProps[] = [
        { sys: { updatedAt: daysAgo(30) } } as EntryProps, // Less than 6 months
        { sys: { updatedAt: daysAgo(200) } } as EntryProps, // More than 6 months
        { sys: { updatedAt: daysAgo(250) } } as EntryProps, // More than 6 months
      ];

      const calculator = new MetricsCalculator(entries, [], {
        needsUpdateMonths: 6,
      });
      const metric = calculator.metrics.find((m) => m.title === 'Needs Update');

      expect(metric?.value).toBe('2');
      expect(metric?.subtitle).toContain('6 months');
    });

    it('uses custom needsUpdateMonths', () => {
      const entries: EntryProps[] = [
        { sys: { updatedAt: daysAgo(400) } } as EntryProps, // More than 12 months
      ];

      const calculator = new MetricsCalculator(entries, [], {
        needsUpdateMonths: 12,
      });
      const metric = calculator.metrics.find((m) => m.title === 'Needs Update');

      expect(metric?.value).toBe('1');
      expect(metric?.subtitle).toContain('12 months');
    });

    it('ignores entries without updatedAt', () => {
      const entries: EntryProps[] = [
        { sys: {} } as EntryProps,
        { sys: { updatedAt: daysAgo(200) } } as EntryProps,
      ];

      const calculator = new MetricsCalculator(entries, [], {
        needsUpdateMonths: 6,
      });
      const metric = calculator.metrics.find((m) => m.title === 'Needs Update');

      expect(metric?.value).toBe('1');
    });
  });
});
