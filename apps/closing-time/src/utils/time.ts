import { ClockFormat } from '../types';

interface TimeOption {
  value: string;
  label: string;
}

const TIME_INTERVAL_MINUTES = 30;

function to12HourLabel(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

function to24HourLabel(hour: number, minute: number) {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function createTimeOptions(clockFormat: ClockFormat): TimeOption[] {
  const options: TimeOption[] = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += TIME_INTERVAL_MINUTES) {
      const value = to24HourLabel(hour, minute);
      const label =
        clockFormat === '24h' ? to24HourLabel(hour, minute) : to12HourLabel(hour, minute);

      options.push({ value, label });
    }
  }

  options.push({
    value: '23:59',
    label: clockFormat === '24h' ? '23:59' : '11:59 PM',
  });

  return options;
}

const OPTIONS_BY_CLOCK_FORMAT: Record<ClockFormat, TimeOption[]> = {
  '12h': createTimeOptions('12h'),
  '24h': createTimeOptions('24h'),
};

export function getTimeOptions(clockFormat: ClockFormat = '12h') {
  return OPTIONS_BY_CLOCK_FORMAT[clockFormat];
}

export function compareTimeValues(left: string, right: string) {
  return left.localeCompare(right);
}

export function formatDisplayTime(time: string, clockFormat: ClockFormat = '12h') {
  if (clockFormat === '24h') {
    return time;
  }

  const [hours, minutes] = time.split(':').map(Number);
  return to12HourLabel(hours, minutes);
}
