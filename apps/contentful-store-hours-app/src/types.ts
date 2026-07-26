export interface TimeSlot {
  open: string;
  close: string;
}

export interface DayHours {
  isOpen: boolean;
  is24Hours: boolean;
  slots: TimeSlot[];
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type HoursOfOperation = Record<DayOfWeek, DayHours>;

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const DEFAULT_SLOT: TimeSlot = {
  open: '09:00',
  close: '17:00',
};

export const DEFAULT_DAY_HOURS: DayHours = {
  isOpen: true,
  is24Hours: false,
  slots: [{ ...DEFAULT_SLOT }],
};

export const DEFAULT_HOURS: HoursOfOperation = {
  monday: { ...DEFAULT_DAY_HOURS, slots: [{ ...DEFAULT_SLOT }] },
  tuesday: { ...DEFAULT_DAY_HOURS, slots: [{ ...DEFAULT_SLOT }] },
  wednesday: { ...DEFAULT_DAY_HOURS, slots: [{ ...DEFAULT_SLOT }] },
  thursday: { ...DEFAULT_DAY_HOURS, slots: [{ ...DEFAULT_SLOT }] },
  friday: { ...DEFAULT_DAY_HOURS, slots: [{ ...DEFAULT_SLOT }] },
  saturday: { isOpen: false, is24Hours: false, slots: [{ ...DEFAULT_SLOT }] },
  sunday: { isOpen: false, is24Hours: false, slots: [{ ...DEFAULT_SLOT }] },
};

export interface DialogInvocationParameters {
  hours: HoursOfOperation;
  [key: string]: unknown;
}
