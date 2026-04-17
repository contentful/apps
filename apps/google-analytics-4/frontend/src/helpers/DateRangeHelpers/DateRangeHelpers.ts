import { DateRangeType } from 'types';

export enum DateRange {
  LastDay = 'lastDay',
  LastWeek = 'lastWeek',
  LastMonth = 'lastMonth',
  LastQuarter = 'lastQuarter',
  LastYear = 'lastYear',
  Custom = 'custom',
}

export const RANGE_OPTIONS = {
  lastDay: { startDaysAgo: 1, endDaysAgo: 0 },
  lastWeek: { startDaysAgo: 7, endDaysAgo: 0 },
  lastMonth: { startDaysAgo: 28, endDaysAgo: 0 },
  lastQuarter: { startDaysAgo: 90, endDaysAgo: 0 },
  lastYear: { startDaysAgo: 365, endDaysAgo: 0 },
};

export const DATE_RANGE_SELECT_OPTIONS: { value: DateRangeType; label: string }[] = [
  { value: DateRange.LastDay, label: 'Last 24 hours' },
  { value: DateRange.LastWeek, label: 'Last 7 days' },
  { value: DateRange.LastMonth, label: 'Last 28 days' },
  { value: DateRange.LastQuarter, label: 'Last 90 days' },
  { value: DateRange.LastYear, label: 'Last 12 months' },
  { value: DateRange.Custom, label: 'Custom range' },
];

const DAY_IN_MS = 1000 * 60 * 60 * 24;

// date should be local to user in format of YYYY-MM-DD
export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  // months start at 0
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month}-${day}`;
};

export const parseDateString = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day);
};

const getRangeDates = (dateRange: DateRangeType) => {
  if (dateRange === DateRange.Custom) {
    return getRangeDates(DateRange.LastWeek);
  }

  const selectedRange = RANGE_OPTIONS[dateRange];
  const today = new Date().valueOf();

  return {
    start: formatDate(new Date(today - DAY_IN_MS * selectedRange.startDaysAgo)),
    end: formatDate(new Date(today - DAY_IN_MS * selectedRange.endDaysAgo)),
  };
};

export default getRangeDates;
