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
