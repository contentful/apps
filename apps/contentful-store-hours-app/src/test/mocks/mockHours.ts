import type { HoursOfOperation, DayHours } from '../../types';

export const mockClosedDay: DayHours = {
  isOpen: false,
  is24Hours: false,
  slots: [],
};

export const mock24HourDay: DayHours = {
  isOpen: true,
  is24Hours: true,
  slots: [],
};

export const mockRegularDay: DayHours = {
  isOpen: true,
  is24Hours: false,
  slots: [{ open: '09:00', close: '17:00' }],
};

export const mockSplitDay: DayHours = {
  isOpen: true,
  is24Hours: false,
  slots: [
    { open: '09:00', close: '12:00' },
    { open: '13:00', close: '17:00' },
  ],
};

export const mockDefaultHours: HoursOfOperation = {
  monday: mockRegularDay,
  tuesday: mockRegularDay,
  wednesday: mockRegularDay,
  thursday: mockRegularDay,
  friday: mockRegularDay,
  saturday: mockClosedDay,
  sunday: mockClosedDay,
};

export const mockAllOpenHours: HoursOfOperation = {
  monday: mockRegularDay,
  tuesday: mockRegularDay,
  wednesday: mockSplitDay,
  thursday: mockRegularDay,
  friday: mockRegularDay,
  saturday: mock24HourDay,
  sunday: mockClosedDay,
};
