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

export enum CreatorViewSetting {
  TopFiveCreators = 'topFiveCreators',
  BottomFiveCreators = 'bottomFiveCreators',
  Alphabetical = 'alphabetical',
}

export enum ConfigField {
  NeedsUpdateMonths = 'needsUpdateMonths',
  RecentlyPublishedDays = 'recentlyPublishedDays',
  TimeToPublishDays = 'timeToPublishDays',
}

export interface ScheduledContentItem {
  id: string;
  title: string;
  contentType: string;
  creator: Creator | null;
  publishedDate: string | null;
  status: EntryStatus;
  scheduledFor: {
    datetime: string;
    timezone?: string;
  };
}
