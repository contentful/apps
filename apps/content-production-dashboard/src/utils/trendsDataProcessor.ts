import { EntryProps } from 'contentful-management';
import { DateCalculator } from './DateCalculator';
import type { ChartDataPoint } from '../components/ChartWrapper';

export type TimeRange = 'year' | '6months' | '3months' | 'month' | 'yearToDate';

export interface TrendsDataProcessorOptions {
  timeRange: TimeRange;
}

export function getStartDateForTimeRange(timeRange: TimeRange): Date {
  const now = new Date();
  const startDate = new Date(now);

  switch (timeRange) {
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'yearToDate':
      startDate.setMonth(0, 1); // January 1st
      startDate.setFullYear(now.getFullYear());
      break;
  }

  return startDate;
}

function filterEntriesByContentTypes(
  entries: EntryProps[],
  contentTypes?: Map<string, string>
): EntryProps[] {
  if (!contentTypes || contentTypes.size === 0) {
    return entries;
  }
  return entries.filter((entry) => {
    const contentTypeId = entry.sys.contentType?.sys?.id;
    return contentTypeId && contentTypes.has(contentTypeId);
  });
}

export function processNewEntries(
  entries: EntryProps[],
  options: TrendsDataProcessorOptions,
  contentTypes?: Map<string, string>
): ChartDataPoint[] {
  const startDate = getStartDateForTimeRange(options.timeRange);
  const now = new Date();
  const monthMap = new Map<string, number>();

  const filteredEntries = filterEntriesByContentTypes(entries, contentTypes);

  filteredEntries.forEach((entry) => {
    const createdAt = DateCalculator.parseDate(entry?.sys?.createdAt);
    if (!createdAt || createdAt < startDate) return;

    const monthYear = DateCalculator.formatMonthYear(createdAt);
    monthMap.set(monthYear, (monthMap.get(monthYear) || 0) + 1);
  });

  // Generate all months in range
  const allMonths = DateCalculator.generateMonthRange(startDate, now);

  // Convert to chart data format
  return allMonths.map((monthYear) => ({
    date: DateCalculator.formatMonthYearDisplay(monthYear),
    'New Content': monthMap.get(monthYear) || 0,
  }));
}

export function processContentTypeTrends(
  entries: EntryProps[],
  options: TrendsDataProcessorOptions,
  contentTypes?: Map<string, string>
): { data: ChartDataPoint[]; contentTypes: string[] } {
  const startDate = getStartDateForTimeRange(options.timeRange);
  const now = new Date();
  const contentTypeMap = new Map<string, Map<string, number>>();
  const foundContentTypeIds = new Set<string>();

  const filteredEntries = filterEntriesByContentTypes(entries, contentTypes);

  filteredEntries.forEach((entry) => {
    const createdAt = DateCalculator.parseDate(entry?.sys?.createdAt);
    if (!createdAt || createdAt < startDate) return;

    const contentTypeId = entry.sys.contentType?.sys?.id;
    if (!contentTypeId) return;

    const monthYear = DateCalculator.formatMonthYear(createdAt);
    foundContentTypeIds.add(contentTypeId);

    if (!contentTypeMap.has(monthYear)) {
      contentTypeMap.set(monthYear, new Map());
    }

    const monthData = contentTypeMap.get(monthYear)!;
    monthData.set(contentTypeId, (monthData.get(contentTypeId) || 0) + 1);
  });

  // Generate all months in range
  const allMonths = DateCalculator.generateMonthRange(startDate, now);
  const contentTypeNamesArray = Array.from(contentTypes?.values() || []).sort();

  // Convert to chart data format
  const data = allMonths.map((monthYear) => {
    const monthData = contentTypeMap.get(monthYear) || new Map();
    const dataPoint: ChartDataPoint = {
      date: DateCalculator.formatMonthYearDisplay(monthYear),
    };

    contentTypeNamesArray.forEach((contentTypeName) => {
      // Find the key (contentTypeId) that has this value (contentTypeName)
      const contentTypeId = Array.from(contentTypes?.entries() || []).find(
        ([, value]) => value === contentTypeName
      )?.[0];
      dataPoint[contentTypeName] = monthData.get(contentTypeId || '') || 0;
    });

    return dataPoint;
  });

  return { data, contentTypes: contentTypeNamesArray };
}

export function processCreatorTrends(
  entries: EntryProps[],
  options: TrendsDataProcessorOptions,
  creatorsNames?: Map<string, string>,
  contentTypes?: Map<string, string>
): { data: ChartDataPoint[]; creators: string[] } {
  const startDate = getStartDateForTimeRange(options.timeRange);
  const now = new Date();
  const creatorMap = new Map<string, Map<string, number>>();
  const creators = new Set<string>();

  const filteredEntries = filterEntriesByContentTypes(entries, contentTypes);

  filteredEntries.forEach((entry) => {
    const createdAt = DateCalculator.parseDate(entry?.sys?.createdAt);
    if (!createdAt || createdAt < startDate) return;

    const creatorId = entry.sys.createdBy?.sys?.id;
    if (!creatorId) return;

    const creatorName = creatorsNames?.get(creatorId) || creatorId;
    const monthYear = DateCalculator.formatMonthYear(createdAt);
    creators.add(creatorName);

    if (!creatorMap.has(monthYear)) {
      creatorMap.set(monthYear, new Map());
    }

    const monthData = creatorMap.get(monthYear)!;
    monthData.set(creatorName, (monthData.get(creatorName) || 0) + 1);
  });

  // Generate all months in range
  const allMonths = DateCalculator.generateMonthRange(startDate, now);
  const creatorArray = Array.from(creators).sort();

  // Convert to chart data format
  const data = allMonths.map((monthYear) => {
    const monthData = creatorMap.get(monthYear) || new Map();
    const dataPoint: ChartDataPoint = {
      date: DateCalculator.formatMonthYearDisplay(monthYear),
    };

    creatorArray.forEach((creatorName) => {
      dataPoint[creatorName] = monthData.get(creatorName) || 0;
    });

    return dataPoint;
  });

  return { data, creators: creatorArray };
}
