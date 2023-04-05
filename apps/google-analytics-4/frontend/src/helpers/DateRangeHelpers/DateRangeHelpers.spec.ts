import { DateRangeType } from '../../types';
import getRangeDates, { RANGE_OPTIONS } from './DateRangeHelpers';

const DAY_IN_MS = 1000 * 3600 * 24;

const getDateRangeTime = (range: DateRangeType) => {
  const { start, end } = getRangeDates(range);
  const getDate = (date: string) => new Date(date).getTime();
  return {
    startTime: getDate(start),
    endTime: getDate(end),
  };
};

const getParsedDateRangeDate = (range: DateRangeType) => {
  const { start, end } = getRangeDates(range);
  const getDate = (date: string) => Number(new Date(date).toLocaleDateString().split('/')[1]);
  return {
    startDay: getDate(start),
    endDay: getDate(end),
  };
};

describe('handle date range helper', () => {
  it('formats dates correctly for week range', () => {
    const { startTime, endTime } = getDateRangeTime('lastWeek');
    const { startDay, endDay } = getParsedDateRangeDate('lastWeek');

    expect((endTime - startTime) / DAY_IN_MS).toBe(RANGE_OPTIONS.lastWeek.startDaysAgo);
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    expect(endDay).toBe(today.getDate());
    expect(startDay).toBe(oneWeekAgo.getDate());
  });

  it('formats dates correctly for day range', () => {
    const { startTime, endTime } = getDateRangeTime('lastDay');
    const { startDay, endDay } = getParsedDateRangeDate('lastDay');

    expect((endTime - startTime) / DAY_IN_MS).toBe(RANGE_OPTIONS.lastDay.startDaysAgo);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(endDay).toBe(today.getDate());
    expect(startDay).toBe(yesterday.getDate());
  });
});
