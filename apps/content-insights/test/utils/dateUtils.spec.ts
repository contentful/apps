import { describe, expect, it } from 'vitest';
import {
  parseDate,
  addDays,
  subDays,
  subMonths,
  isWithin,
  formatTimeTo12Hour,
  parse12HourTimeToDate,
  formatDateTimeWithTimezone,
  formatMonthYear,
  formatMonthYearDisplay,
} from '../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('parseDate', () => {
    it('parses valid date string', () => {
      const result = parseDate('2024-01-15T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(new Date('2024-01-15T10:30:00Z').getTime());
    });

    it('returns undefined for invalid or empty input', () => {
      expect(parseDate(undefined)).toBeUndefined();
      expect(parseDate('')).toBeUndefined();
      expect(parseDate('invalid-date')).toBeUndefined();
    });
  });

  describe('addDays', () => {
    it('adds days correctly', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
      expect(result.getMonth()).toBe(0); // January
    });

    it('handles month overflow correctly', () => {
      const date = new Date('2024-01-30T10:00:00Z');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1); // February
    });

    it('handles year overflow correctly', () => {
      const date = new Date('2024-12-30T10:00:00Z');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2025);
    });

    it('handles negative days (subtracts)', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });
  });

  describe('subDays', () => {
    it('subtracts days correctly', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = subDays(date, 5);
      expect(result.getDate()).toBe(10);
      expect(result.getMonth()).toBe(0); // January
    });

    it('handles month and year underflow correctly', () => {
      const date = new Date('2024-01-05T10:00:00Z');
      const result = subDays(date, 10);
      expect(result.getDate()).toBe(26);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getFullYear()).toBe(2023);
    });
  });

  describe('subMonths', () => {
    it('subtracts months correctly for normal dates and handles year underflow', () => {
      const normalDate = new Date('2024-03-15T10:00:00Z');
      const normalResult = subMonths(normalDate, 1);
      expect(normalResult.getMonth()).toBe(1); // February
      expect(normalResult.getFullYear()).toBe(2024);
      expect(normalResult.getDate()).toBe(15);

      const yearUnderflowDate = new Date('2024-01-15T10:00:00Z');
      const yearUnderflowResult = subMonths(yearUnderflowDate, 1);
      expect(yearUnderflowResult.getMonth()).toBe(11); // December
      expect(yearUnderflowResult.getFullYear()).toBe(2023);
      expect(yearUnderflowResult.getDate()).toBe(15);
    });

    it('correctly handles March 31st minus one month (leap and non-leap year edge case)', () => {
      const leapYearDate = new Date('2024-03-31T10:00:00Z');
      const leapYearResult = subMonths(leapYearDate, 1);
      expect(leapYearResult.getMonth()).toBe(1); // February
      expect(leapYearResult.getFullYear()).toBe(2024);
      expect(leapYearResult.getDate()).toBe(29); // February 29th in leap year

      const nonLeapYearDate = new Date('2023-03-31T10:00:00Z');
      const nonLeapYearResult = subMonths(nonLeapYearDate, 1);
      expect(nonLeapYearResult.getMonth()).toBe(1); // February
      expect(nonLeapYearResult.getFullYear()).toBe(2023);
      expect(nonLeapYearResult.getDate()).toBe(28); // February 28th in non-leap year
    });
  });

  describe('isWithin', () => {
    it('returns true when date is within range', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const start = new Date('2024-01-10T10:00:00Z');
      const end = new Date('2024-01-20T10:00:00Z');
      expect(isWithin(date, start, end)).toBe(true);
    });

    it('returns true when date equals start (inclusive)', () => {
      const date = new Date('2024-01-10T10:00:00Z');
      const start = new Date('2024-01-10T10:00:00Z');
      const end = new Date('2024-01-20T10:00:00Z');
      expect(isWithin(date, start, end)).toBe(true);
    });

    it('returns false when date equals end (exclusive)', () => {
      const date = new Date('2024-01-20T10:00:00Z');
      const start = new Date('2024-01-10T10:00:00Z');
      const end = new Date('2024-01-20T10:00:00Z');
      expect(isWithin(date, start, end)).toBe(false);
    });

    it('returns false when date is before start', () => {
      const date = new Date('2024-01-05T10:00:00Z');
      const start = new Date('2024-01-10T10:00:00Z');
      const end = new Date('2024-01-20T10:00:00Z');
      expect(isWithin(date, start, end)).toBe(false);
    });

    it('returns false when date is after end', () => {
      const date = new Date('2024-01-25T10:00:00Z');
      const start = new Date('2024-01-10T10:00:00Z');
      const end = new Date('2024-01-20T10:00:00Z');
      expect(isWithin(date, start, end)).toBe(false);
    });
  });

  describe('formatTimeTo12Hour', () => {
    it('formats AM and PM times correctly', () => {
      const date15min = new Date(2024, 0, 15, 10, 15, 0);
      const date30min = new Date(2024, 0, 15, 10, 30, 0);
      const date45min = new Date(2024, 0, 15, 10, 45, 0);
      expect(formatTimeTo12Hour(date15min.toISOString())).toBe('10:00 AM');
      expect(formatTimeTo12Hour(date30min.toISOString())).toBe('10:30 AM');
      expect(formatTimeTo12Hour(date45min.toISOString())).toBe('10:30 AM');
    });

    it('formats noon and midnight correctly', () => {
      const noonDate = new Date(2024, 0, 15, 12, 0, 0);
      const midnightDate = new Date(2024, 0, 15, 0, 0, 0);
      expect(formatTimeTo12Hour(noonDate.toISOString())).toBe('12:00 PM');
      expect(formatTimeTo12Hour(midnightDate.toISOString())).toBe('12:00 AM');
    });

    it('returns empty string for invalid date', () => {
      expect(formatTimeTo12Hour('invalid-date')).toBe('');
    });
  });

  describe('parse12HourTimeToDate', () => {
    it('parses AM and PM times correctly', () => {
      const baseDate = new Date('2024-01-15T00:00:00Z');
      const amResult = parse12HourTimeToDate(baseDate, '9:30 AM');
      expect(amResult.getHours()).toBe(9);
      expect(amResult.getMinutes()).toBe(30);

      const pmResult = parse12HourTimeToDate(baseDate, '3:45 PM');
      expect(pmResult.getHours()).toBe(15);
      expect(pmResult.getMinutes()).toBe(45);
    });

    it('parses noon and midnight correctly', () => {
      const baseDate = new Date('2024-01-15T00:00:00Z');
      expect(parse12HourTimeToDate(baseDate, '12:00 PM').getHours()).toBe(12);
      expect(parse12HourTimeToDate(baseDate, '12:00 AM').getHours()).toBe(0);
    });

    it('preserves the base date', () => {
      const baseDate = new Date('2024-01-15T10:00:00Z');
      const result = parse12HourTimeToDate(baseDate, '3:00 PM');
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2024);
    });
  });

  describe('formatDateTimeWithTimezone', () => {
    it('formats date with and without timezone', () => {
      const withTz = formatDateTimeWithTimezone('2024-01-15T10:30:00Z', 'America/New_York');
      expect(withTz).toContain('Jan');
      expect(withTz).toContain('15');
      expect(withTz).toContain('2024');

      const withoutTz = formatDateTimeWithTimezone('2024-01-15T10:30:00Z');
      expect(withoutTz).toContain('Jan');
      expect(withoutTz).toContain('15');
      expect(withoutTz).toContain('2024');
    });

    it('returns dash for invalid or empty input', () => {
      expect(formatDateTimeWithTimezone(undefined)).toBe('—');
      expect(formatDateTimeWithTimezone('')).toBe('—');
      expect(formatDateTimeWithTimezone('invalid-date')).toBe('—');
    });
  });

  describe('formatMonthYear', () => {
    it('formats date as YYYY-MM with leading zeros', () => {
      expect(formatMonthYear(new Date('2024-01-15T10:00:00Z'))).toBe('2024-01');
      expect(formatMonthYear(new Date('2024-03-15T10:00:00Z'))).toBe('2024-03');
      expect(formatMonthYear(new Date('2024-12-15T10:00:00Z'))).toBe('2024-12');
    });
  });

  describe('formatMonthYearDisplay', () => {
    it('formats month year string as display format', () => {
      expect(formatMonthYearDisplay('2024-01')).toBe('Jan 2024');
      expect(formatMonthYearDisplay('2024-03')).toBe('Mar 2024');
      expect(formatMonthYearDisplay('2024-12')).toBe('Dec 2024');
      expect(formatMonthYearDisplay('2023-05')).toBe('May 2023');
    });
  });
});
