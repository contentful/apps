import { EntryProps } from 'contentful-management';

export type ChartDataPoint = Record<string, string | number>;

export interface ChartWrapperProps {
  data: ChartDataPoint[];
  xAxisDataKey: string;
  height?: number;
  legendTitle?: string;
  processedContentTypes?: Map<string, string>;
  inNewEntriesTab?: boolean;
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
export interface Creator {
  id: string;
  firstName?: string;
  lastName?: string;
}

export enum EntryStatus {
  Draft = 'Draft',
  Published = 'Published',
  Changed = 'Changed',
}

export interface ScheduledEntry {
  id: string;
  title: string;
  contentType: string;
  contentTypeId: string;
  creator: Creator | null;
  publishedDate: string | null;
  updatedDate: string;
  status: EntryStatus;
}

export interface ScheduledContentItem extends ScheduledEntry {
  scheduledActionId: string;
  scheduledFor: string;
}
