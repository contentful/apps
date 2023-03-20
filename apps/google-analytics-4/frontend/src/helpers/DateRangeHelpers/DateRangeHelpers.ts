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

// date should be local to user in format of YYYY-MM-DD
const formatDate = (date: Date) => {
  const localDate = date.toLocaleDateString().split('/');
  return `${localDate[2]}-${localDate[0]}-${localDate[1]}`;
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
