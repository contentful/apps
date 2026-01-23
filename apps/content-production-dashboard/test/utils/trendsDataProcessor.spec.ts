import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { EntryProps } from 'contentful-management';
import {
  generateNewEntriesChartData,
  generateContentTypeChartData,
  generateCreatorChartData,
} from '../../src/utils/trendsDataProcessor';
import { TimeRange } from '../../src/utils/types';
import { createMockEntry } from './testHelpers';

describe('trendsDataProcessor', () => {
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateNewEntriesChartData', () => {
    it('generates chart data with correct entry counts per month', () => {
      const entries: EntryProps[] = [
        createMockEntry({
          createdAt: oneMonthAgo.toISOString(),
          contentTypeId: 'blogPost',
        }),
        createMockEntry({
          createdAt: oneMonthAgo.toISOString(),
          contentTypeId: 'article',
        }),
        createMockEntry({
          createdAt: now.toISOString(),
          contentTypeId: 'blogPost',
        }),
      ];

      const result = generateNewEntriesChartData(entries, { timeRange: TimeRange.Month });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('New Content');
      expect(result.some((dataPoint) => (dataPoint['New Content'] as number) > 0)).toBe(true);
    });

    it('filters entries by content types when provided', () => {
      const entries: EntryProps[] = [
        createMockEntry({
          createdAt: oneMonthAgo.toISOString(),
          contentTypeId: 'blogPost',
        }),
        createMockEntry({
          createdAt: oneMonthAgo.toISOString(),
          contentTypeId: 'article',
        }),
      ];

      const contentTypes = new Map<string, string>();
      contentTypes.set('blogPost', 'Blog Post');

      const result = generateNewEntriesChartData(
        entries,
        { timeRange: TimeRange.Month },
        contentTypes
      );

      // Should only count blogPost entries
      const totalCount = result.reduce(
        (sum, dataPoint) => sum + (dataPoint['New Content'] as number),
        0
      );
      expect(totalCount).toBe(1);
    });

    it('calculates average time to publish correctly for entries in a specific month', () => {
      const targetMonth = new Date(now);
      targetMonth.setMonth(now.getMonth() - 1);
      targetMonth.setDate(15); // Middle of the month

      const entry1Created = new Date(targetMonth);
      entry1Created.setDate(10);
      const entry1Published = new Date(targetMonth);
      entry1Published.setDate(12); // 2 days later

      const entry2Created = new Date(targetMonth);
      entry2Created.setDate(10);
      const entry2Published = new Date(targetMonth);
      entry2Published.setDate(14); // 4 days later

      const entry3Created = new Date(targetMonth);
      entry3Created.setDate(10);
      const entry3Published = new Date(targetMonth);
      entry3Published.setDate(16); // 6 days later

      const entries: EntryProps[] = [
        createMockEntry({
          createdAt: entry1Created.toISOString(),
          publishedAt: entry1Published.toISOString(),
        }),
        createMockEntry({
          createdAt: entry2Created.toISOString(),
          publishedAt: entry2Published.toISOString(),
        }),
        createMockEntry({
          createdAt: entry3Created.toISOString(),
          publishedAt: entry3Published.toISOString(),
        }),
      ];

      const result = generateNewEntriesChartData(entries, { timeRange: TimeRange.ThreeMonths });

      // Target month (1 month ago) is at index 2
      expect(result.length).toBeGreaterThanOrEqual(4);
      expect(result[2]['New Content']).toBe(3);
      expect(result[2]['avgTimeToPublish']).toBeCloseTo(4, 1);
    });

    it('returns undefined for avgTimeToPublish when entries are not published', () => {
      const targetMonth = new Date(now);
      targetMonth.setMonth(now.getMonth() - 1);
      targetMonth.setDate(15);

      const entry1 = createMockEntry({
        createdAt: targetMonth.toISOString(),
      });
      entry1.sys.publishedAt = undefined;

      const entry2 = createMockEntry({
        createdAt: targetMonth.toISOString(),
      });
      entry2.sys.publishedAt = undefined;

      const entries: EntryProps[] = [entry1, entry2];

      const result = generateNewEntriesChartData(entries, { timeRange: TimeRange.ThreeMonths });

      // Target month (1 month ago) is at index 2
      expect(result[2]['New Content']).toBe(2);
      expect(result[2]['avgTimeToPublish']).toBeUndefined();
    });
  });

  describe('generateContentTypeChartData', () => {
    it('generates chart data grouped by content type IDs and returns processed content types map', () => {
      const entries: EntryProps[] = [
        createMockEntry({
          createdAt: oneMonthAgo.toISOString(),
          contentTypeId: 'blogPost',
        }),
        createMockEntry({
          createdAt: oneMonthAgo.toISOString(),
          contentTypeId: 'article',
        }),
        createMockEntry({
          createdAt: now.toISOString(),
          contentTypeId: 'blogPost',
        }),
      ];

      const contentTypes = new Map<string, string>();
      contentTypes.set('blogPost', 'Blog Post');
      contentTypes.set('article', 'Article');

      const result = generateContentTypeChartData(
        entries,
        { timeRange: TimeRange.Month },
        contentTypes
      );

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.processedContentTypes.size).toBe(2);
      expect(result.processedContentTypes.get('blogPost')).toBe('Blog Post');
      expect(result.processedContentTypes.get('article')).toBe('Article');
      expect(result.data[0]).toHaveProperty('blogPost');
      expect(result.data[0]).toHaveProperty('article');
    });
  });

  describe('generateCreatorChartData', () => {
    it('generates chart data grouped by creator names', () => {
      const entries: EntryProps[] = [
        createMockEntry({
          createdAt: oneMonthAgo.toISOString(),
          createdById: 'user-1',
        }),
        createMockEntry({
          createdAt: oneMonthAgo.toISOString(),
          createdById: 'user-2',
        }),
        createMockEntry({
          createdAt: now.toISOString(),
          createdById: 'user-1',
        }),
      ];

      const creatorsNames = new Map<string, string>();
      creatorsNames.set('user-1', 'John Doe');
      creatorsNames.set('user-2', 'Jane Smith');

      const result = generateCreatorChartData(
        entries,
        { timeRange: TimeRange.Month },
        creatorsNames
      );

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.creators).toContain('John Doe');
      expect(result.creators).toContain('Jane Smith');
      expect(result.data[0]).toHaveProperty('John Doe');
      expect(result.data[0]).toHaveProperty('Jane Smith');
    });
  });

  describe('Edge cases', () => {
    it('handles empty entries array gracefully', () => {
      const result = generateNewEntriesChartData([], { timeRange: TimeRange.Month });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((dataPoint) => dataPoint['New Content'] === 0)).toBe(true);
    });
  });
});
