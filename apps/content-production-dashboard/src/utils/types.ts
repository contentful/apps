export type ChartDataPoint = Record<string, string | number>;

export interface ChartWrapperProps {
  data: ChartDataPoint[];
  xAxisDataKey: string;
  linesLegends: string[];
  height?: number;
  legendTitle?: string;
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
