export type ChartDataPoint = Record<string, string | number>;

export interface ChartWrapperProps {
  data: ChartDataPoint[];
  xAxisDataKey: string;
  linesLegends: string[];
  height?: number;
  legendTitle?: string;
}

export type TimeRange = 'year' | '6months' | '3months' | 'month' | 'yearToDate';

export interface TrendsDataProcessorOptions {
  timeRange: TimeRange;
}
