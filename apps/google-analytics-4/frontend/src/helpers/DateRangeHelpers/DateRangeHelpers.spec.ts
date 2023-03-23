import { DateRangeType } from '@/types';
import getRangeDates, { RANGE_OPTIONS } from './DateRangeHelpers';

const calculateRangeDates = (range: DateRangeType) => {
  const { start, end } = getRangeDates(range);
  const getDate = (date: string) => Number(new Date(date).toLocaleDateString().split('/')[1]);
  return {
    startDay: getDate(start),
    endDay: getDate(end),
  };
};

describe('handle date range helper', () => {
  it('formats dates correctly for week range', () => {
    const { startDay, endDay } = calculateRangeDates('lastWeek');

    expect(endDay - startDay).toBe(RANGE_OPTIONS.lastWeek.startDaysAgo);
  });

  it('formats dates correctly for day range', () => {
    const { startDay, endDay } = calculateRangeDates('lastDay');

    expect(endDay - startDay).toBe(RANGE_OPTIONS.lastDay.startDaysAgo);
  });
});
