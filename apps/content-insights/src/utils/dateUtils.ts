import dayjs from 'dayjs';

export const msPerDay = 24 * 60 * 60 * 1000;

export type MaybeDate = Date | undefined;

export function parseDate(value: string | undefined): MaybeDate {
  if (!value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : undefined;
}

export function addDays(date: Date, days: number): Date {
  return dayjs(date).add(days, 'day').toDate();
}

export function subDays(date: Date, days: number): Date {
  return dayjs(date).subtract(days, 'day').toDate();
}

export function subMonths(base: Date, months: number): Date {
  return dayjs(base).subtract(months, 'month').toDate();
}

export function isWithin(d: Date, startInclusive: Date, endExclusive: Date): boolean {
  const date = dayjs(d);
  const start = dayjs(startInclusive);
  const end = dayjs(endExclusive);
  return (date.isAfter(start) || date.isSame(start)) && date.isBefore(end);
}

export const formatTimeTo12Hour = (dateString: string): string => {
  try {
    const date = dayjs(dateString);
    if (!date.isValid()) return '';

    let hours = date.hour();
    const minutes = date.minute();
    const period = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    if (hours === 0) hours = 12;

    const roundedMinutes = minutes < 30 ? 0 : 30;

    return `${hours}:${String(roundedMinutes).padStart(2, '0')} ${period}`;
  } catch {
    return '';
  }
};

export const parse12HourTimeToDate = (date: Date, timeString: string): Date => {
  const [timePart, period] = timeString.split(' ');
  const [hours, minutes] = timePart.split(':');
  let hour24 = parseInt(hours, 10);

  if (period.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0;
  }

  return dayjs(date).hour(hour24).minute(parseInt(minutes, 10)).second(0).millisecond(0).toDate();
};

export const formatDateTimeWithTimezone = (
  dateString: string | undefined,
  timezone?: string
): string => {
  if (!dateString) return '—';
  try {
    const date = dayjs(dateString);
    if (!date.isValid()) return '—';

    return date.toDate().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      ...(timezone && { timeZone: timezone }),
    });
  } catch {
    return '—';
  }
};

export const formatMonthYear = (date: Date): string => {
  return dayjs(date).format('YYYY-MM');
};

export const formatMonthYearDisplay = (monthYear: string): string => {
  const [year, month] = monthYear.split('-');
  const date = dayjs()
    .year(parseInt(year, 10))
    .month(parseInt(month, 10) - 1)
    .date(1);
  return date.format('MMM YYYY');
};
