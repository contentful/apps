import {
  DEFAULT_DAY_HOURS,
  DEFAULT_HOURS,
  DAYS_OF_WEEK,
  DayOfWeek,
  HoursOfOperation,
} from '../types';

export function cloneHours(hours: HoursOfOperation): HoursOfOperation {
  return DAYS_OF_WEEK.reduce((nextHours, day) => {
    nextHours[day] = {
      isOpen: hours[day].isOpen,
      is24Hours: hours[day].is24Hours,
      slots: hours[day].slots.map((slot) => ({ ...slot })),
    };

    return nextHours;
  }, {} as HoursOfOperation);
}

export function createFallbackDayHours(day: DayOfWeek) {
  if (day === 'saturday' || day === 'sunday') {
    return { isOpen: false, is24Hours: false, slots: [] };
  }

  return {
    isOpen: DEFAULT_DAY_HOURS.isOpen,
    is24Hours: DEFAULT_DAY_HOURS.is24Hours,
    slots: DEFAULT_DAY_HOURS.slots.map((slot) => ({ ...slot })),
  };
}

export function normalizeHours(
  hours: HoursOfOperation | undefined,
  fallbackHours: HoursOfOperation = DEFAULT_HOURS
) {
  return DAYS_OF_WEEK.reduce((nextHours, day) => {
    const sourceDay = hours?.[day] ?? fallbackHours[day] ?? createFallbackDayHours(day);

    nextHours[day] = {
      isOpen: sourceDay.isOpen,
      is24Hours: sourceDay.is24Hours,
      slots: sourceDay.slots.map((slot) => ({ ...slot })),
    };

    return nextHours;
  }, {} as HoursOfOperation);
}
