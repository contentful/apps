import { EntryProps } from 'contentful-management';

export type ChartDataPoint = Record<string, string | number>;

export interface ChartWrapperProps {
  data: ChartDataPoint[];
  xAxisDataKey: string;
  height?: number;
  legendTitle?: string;
  processedContentTypes?: Map<string, string>;
}

export enum TimeRange {
  Month = 'month',
  ThreeMonths = '3months',
  SixMonths = '6months',
  Year = 'year',
  YearToDate = 'yearToDate',
}

export interface TrendsDataProcessorOptions {
  timeRange: TimeRange;
}

export type ChartDataSetup = {
  startDate: Date;
  now: Date;
  filteredEntries: EntryProps[];
  allMonths: string[];
};

export type NewEntriesMonth = {
  count: number;
  publishTimes: number[];
};

export type MonthMetrics = {
  newContent: number;
  avgTimeToPublish: number | undefined;
};
