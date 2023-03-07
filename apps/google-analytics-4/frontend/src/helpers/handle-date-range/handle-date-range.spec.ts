import { DateRangeType } from '@/types';
import getRangeDates, { RANGE_OPTIONS } from './handle-date-range';

const MS_PER_DAY = 86400000;

const calculateRangeDates = (range: DateRangeType) => {
  const { start, end } = getRangeDates(range);
  return {
    startDate: new Date(start).getTime() / MS_PER_DAY,
    endDate: new Date(end).getTime() / MS_PER_DAY,
  };
};

describe('handle date range helper', () => {
  it('formats dates correctly for week range', () => {
    const { startDate, endDate } = calculateRangeDates('lastWeek');

    expect(endDate - startDate).toBe(RANGE_OPTIONS.lastWeek.startDaysAgo);
  });

  it('formats dates correctly for day range', () => {
    const { startDate, endDate } = calculateRangeDates('lastDay');

    expect(endDate - startDate).toBe(RANGE_OPTIONS.lastDay.startDaysAgo);
  });

  it('formats dates correctly for 28 day range', () => {
    const { startDate, endDate } = calculateRangeDates('lastMonth');

    expect(endDate - startDate).toBe(RANGE_OPTIONS.lastMonth.startDaysAgo);
  });
});
