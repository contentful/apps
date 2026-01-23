import { EntryProps } from 'contentful-management';
import { parseDate, msPerDay } from './dateCalculator';
import { formatMonthYear, formatMonthYearDisplay } from './dateFormat';
import type {
  ChartDataPoint,
  ChartDataSetup,
  MonthMetrics,
  NewEntriesMonth,
  TrendsDataProcessorOptions,
} from './types';
import { TimeRange } from './types';

export function generateNewEntriesChartData(
  entries: EntryProps[],
  options: TrendsDataProcessorOptions,
  contentTypes?: Map<string, string>
): ChartDataPoint[] {
  const { startDate, filteredEntries, allMonths } = setupChartData(entries, options, contentTypes);

  const monthData = countNewEntriesByMonth(filteredEntries, startDate);

  return allMonths.map((monthYear: string, index: number) => {
    const currentData = monthData.get(monthYear) || { count: 0, publishTimes: [] };
    const currentMetrics = getMonthMetrics(currentData);

    const previousMonthYear = index > 0 ? allMonths[index - 1] : null;
    const previousData = previousMonthYear ? monthData.get(previousMonthYear) : null;
    const previousMetrics = previousData ? getMonthMetrics(previousData) : null;

    return buildNewEntriesDataPoint(monthYear, currentMetrics, previousMetrics);
  });
}

export function generateContentTypeChartData(
  entries: EntryProps[],
  options: TrendsDataProcessorOptions,
  contentTypes?: Map<string, string>
): { data: ChartDataPoint[]; processedContentTypes: Map<string, string> } {
  const { startDate, filteredEntries, allMonths } = setupChartData(entries, options, contentTypes);

  // Group entries by month and content type
  const contentTypeIdsSet = new Set<string>();
  const monthMap = groupEntriesByMonthAndKey(filteredEntries, startDate, (entry) => {
    const contentTypeId = entry.sys.contentType?.sys?.id || null;
    if (contentTypeId) {
      contentTypeIdsSet.add(contentTypeId);
    }
    return contentTypeId;
  });

  const contentTypeIds = Array.from(contentTypeIdsSet).sort();
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
  const { startDate, filteredEntries, allMonths } = setupChartData(entries, options, contentTypes);

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

function calculateAverage(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculatePercentageChange(current: number, previous: number): number | undefined {
  if (previous === 0) {
    return current > 0 ? 100 : undefined;
  }
  return ((current - previous) / previous) * 100;
}

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

  entries.forEach((entry) => {
    const createdAt = parseDate(entry?.sys?.createdAt);
    if (!createdAt || createdAt < startDate) return;

    const key = getKey(entry);
    if (!key) return;

    const monthYear = formatMonthYear(createdAt);

    if (!monthMap.has(monthYear)) {
      monthMap.set(monthYear, new Map());
    }

    const monthData = monthMap.get(monthYear)!;
    monthData.set(key, (monthData.get(key) || 0) + 1);
  });

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

    keys.forEach((key) => {
      dataPoint[key] = monthData.get(key) || 0;
    });

    return dataPoint;
  });
}

function setupChartData(
  entries: EntryProps[],
  options: TrendsDataProcessorOptions,
  contentTypes?: Map<string, string>
): ChartDataSetup {
  const startDate = getStartDateForTimeRange(options.timeRange);
  const now = new Date();
  const filteredEntries = filterEntriesByContentTypes(entries, contentTypes);
  const allMonths = generateMonthRange(startDate, now);

  return { startDate, now, filteredEntries, allMonths };
}

function countNewEntriesByMonth(
  entries: EntryProps[],
  startDate: Date
): Map<string, NewEntriesMonth> {
  const monthData = new Map<string, NewEntriesMonth>();

  for (const entry of entries) {
    const createdAt = parseDate(entry?.sys?.createdAt);
    if (!createdAt || createdAt < startDate) continue;

    const monthYear = formatMonthYear(createdAt);
    const data = monthData.get(monthYear) || { count: 0, publishTimes: [] };
    data.count++;

    const publishedAt = parseDate(entry?.sys?.publishedAt);
    if (publishedAt && publishedAt >= createdAt) {
      const daysToPublish = (publishedAt.getTime() - createdAt.getTime()) / msPerDay;
      if (daysToPublish >= 0) {
        data.publishTimes.push(daysToPublish);
      }
    }

    monthData.set(monthYear, data);
  }

  return monthData;
}

function getMonthMetrics(data: NewEntriesMonth): MonthMetrics {
  return {
    newContent: data.count,
    avgTimeToPublish: calculateAverage(data.publishTimes),
  };
}

function buildNewEntriesDataPoint(
  monthYear: string,
  currentMetrics: MonthMetrics,
  previousMetrics: MonthMetrics | null
): ChartDataPoint {
  const dataPoint: ChartDataPoint = {
    date: formatMonthYearDisplay(monthYear),
    'New Content': currentMetrics.newContent,
  };

  if (currentMetrics.avgTimeToPublish !== undefined) {
    dataPoint['avgTimeToPublish'] = currentMetrics.avgTimeToPublish;
  }

  if (previousMetrics !== null) {
    const newContentChange = calculatePercentageChange(
      currentMetrics.newContent,
      previousMetrics.newContent
    );
    if (newContentChange !== undefined) {
      dataPoint['newContentChange'] = newContentChange;
    }

    if (
      currentMetrics.avgTimeToPublish !== undefined &&
      previousMetrics.avgTimeToPublish !== undefined
    ) {
      const timeToPublishChange = calculatePercentageChange(
        currentMetrics.avgTimeToPublish,
        previousMetrics.avgTimeToPublish
      );
      if (timeToPublishChange !== undefined) {
        dataPoint['avgTimeToPublishChange'] = timeToPublishChange;
      }
    }
  }

  return dataPoint;
}
