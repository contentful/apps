import { DateRangeType } from 'types';

export enum DateRange {
  LastWeek = 'lastWeek',
  LastDay = 'lastDay',
  LastMonth = 'lastMonth',
}

export const RANGE_OPTIONS = {
  lastDay: { startDaysAgo: 1, endDaysAgo: 0 },
  lastWeek: { startDaysAgo: 7, endDaysAgo: 0 },
  lastMonth: { startDaysAgo: 28, endDaysAgo: 0 },
};

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const formatDate = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

const getRangeDates = (dateRange: DateRangeType) => {
  const selectedRange = RANGE_OPTIONS[dateRange];
  const today = new Date().valueOf();

  return {
    start: formatDate(new Date(today - DAY_IN_MS * selectedRange.startDaysAgo)),
    end: formatDate(new Date(today - DAY_IN_MS * selectedRange.endDaysAgo)),
  };
};

export default getRangeDates;
