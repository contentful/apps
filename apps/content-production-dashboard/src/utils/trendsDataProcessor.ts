import { EntryProps } from 'contentful-management';
import { parseDate } from './dateCalculator';
import { formatMonthYear, formatMonthYearDisplay } from './dateFormat';
import type { ChartDataPoint, TrendsDataProcessorOptions } from './types';
import { TimeRange } from './types';

export function getStartDateForTimeRange(timeRange: TimeRange): Date {
  const now = new Date();
  const startDate = new Date(now);

  switch (timeRange) {
    case TimeRange.Month:
      startDate.setMonth(now.getMonth() - 1);
      break;
    case TimeRange.ThreeMonths:
      startDate.setMonth(now.getMonth() - 3);
      break;
    case TimeRange.SixMonths:
      startDate.setMonth(now.getMonth() - 6);
      break;
    case TimeRange.Year:
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case TimeRange.YearToDate:
      startDate.setMonth(0, 1); // January 1st
      startDate.setFullYear(now.getFullYear());
      break;
  }

  return startDate;
}

export function generateMonthRange(startDate: Date, endDate: Date): string[] {
  const months: string[] = [];
  const current = new Date(startDate);
  current.setDate(1);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setDate(1);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    months.push(formatMonthYear(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
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

function groupEntriesByMonthAndKey(
  entries: EntryProps[],
  startDate: Date,
  getKey: (entry: EntryProps) => string | null
): Map<string, Map<string, number>> {
  const monthMap = new Map<string, Map<string, number>>();

  for (const entry of entries) {
    const createdAt = parseDate(entry?.sys?.createdAt);
    if (!createdAt || createdAt < startDate) continue;

    const key = getKey(entry);
    if (!key) continue;

    const monthYear = formatMonthYear(createdAt);

    if (!monthMap.has(monthYear)) {
      monthMap.set(monthYear, new Map());
    }

    const monthData = monthMap.get(monthYear)!;
    monthData.set(key, (monthData.get(key) || 0) + 1);
  }

  return monthMap;
}

function buildChartDataFromMonthMap(
  monthMap: Map<string, Map<string, number>>,
  allMonths: string[],
  keys: string[]
): ChartDataPoint[] {
  return allMonths.map((monthYear) => {
    const monthData = monthMap.get(monthYear) || new Map();
    const dataPoint: ChartDataPoint = {
      date: formatMonthYearDisplay(monthYear),
    };

    for (const key of keys) {
      dataPoint[key] = monthData.get(key) || 0;
    }

    return dataPoint;
  });
}

export function generateNewEntriesChartData(
  entries: EntryProps[],
  options: TrendsDataProcessorOptions,
  contentTypes?: Map<string, string>
): ChartDataPoint[] {
  const startDate = getStartDateForTimeRange(options.timeRange);
  const now = new Date();

  const filteredEntries = filterEntriesByContentTypes(entries, contentTypes);
  const allMonths = generateMonthRange(startDate, now);

  const monthCounts = new Map<string, number>();
  for (const entry of filteredEntries) {
    const createdAt = parseDate(entry?.sys?.createdAt);
    if (!createdAt || createdAt < startDate) continue;

    const monthYear = formatMonthYear(createdAt);
    monthCounts.set(monthYear, (monthCounts.get(monthYear) || 0) + 1);
  }

  // Build chart data
  return allMonths.map((monthYear) => ({
    date: formatMonthYearDisplay(monthYear),
    'New Content': monthCounts.get(monthYear) || 0,
  }));
}

export function generateContentTypeChartData(
  entries: EntryProps[],
  options: TrendsDataProcessorOptions,
  contentTypes?: Map<string, string>
): { data: ChartDataPoint[]; processedContentTypes: Map<string, string> } {
  const startDate = getStartDateForTimeRange(options.timeRange);
  const now = new Date();
  const contentTypeMap = new Map<string, Map<string, number>>();
  const foundContentTypeIds = new Set<string>();

  const filteredEntries = filterEntriesByContentTypes(entries, contentTypes);

  filteredEntries.forEach((entry) => {
    const createdAt = parseDate(entry?.sys?.createdAt);
    if (!createdAt || createdAt < startDate) return;

    const contentTypeId = entry.sys.contentType?.sys?.id;
    if (!contentTypeId) return;

    const monthYear = formatMonthYear(createdAt);
    foundContentTypeIds.add(contentTypeId);

    if (!contentTypeMap.has(monthYear)) {
      contentTypeMap.set(monthYear, new Map());
    }

    const monthData = contentTypeMap.get(monthYear)!;
    monthData.set(contentTypeId, (monthData.get(contentTypeId) || 0) + 1);
  });

  // Generate all months in range
  const allMonths = generateMonthRange(startDate, now);

  // Group entries by month and contentTypeId
  const monthMap = groupEntriesByMonthAndKey(filteredEntries, startDate, (entry) => {
    return entry.sys.contentType?.sys?.id || null;
  });

  const contentTypeIds = Array.from(contentTypes?.keys() || []).sort();

  const data = buildChartDataFromMonthMap(monthMap, allMonths, contentTypeIds);

  const processedContentTypes = new Map<string, string>();
  contentTypeIds.forEach((contentTypeId) => {
    const contentTypeName = contentTypes?.get(contentTypeId);
    if (contentTypeName) {
      processedContentTypes.set(contentTypeId, contentTypeName);
    }
  });

  return { data, processedContentTypes };
}

export function generateCreatorChartData(
  entries: EntryProps[],
  options: TrendsDataProcessorOptions,
  creatorsNames?: Map<string, string>,
  contentTypes?: Map<string, string>
): { data: ChartDataPoint[]; creators: string[] } {
  const startDate = getStartDateForTimeRange(options.timeRange);
  const now = new Date();

  const filteredEntries = filterEntriesByContentTypes(entries, contentTypes);
  const allMonths = generateMonthRange(startDate, now);

  // Group entries by month and creator name
  const creatorsSet = new Set<string>();
  const monthMap = groupEntriesByMonthAndKey(filteredEntries, startDate, (entry) => {
    const creatorId = entry.sys.createdBy?.sys?.id;
    if (!creatorId) return null;

    const creatorName = creatorsNames?.get(creatorId) || creatorId;
    creatorsSet.add(creatorName);
    return creatorName;
  });

  const creators = Array.from(creatorsSet).sort();

  const data = buildChartDataFromMonthMap(monthMap, allMonths, creators);

  return { data, creators };
}
