import { useState, useCallback } from 'react';
import { FieldAppSDK, SerializedJSONValue } from '@contentful/app-sdk';
import { useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import { Button, Stack, Text, Badge, Box, FormControl, Select } from '@contentful/f36-components';
import { ClockIcon } from '@contentful/f36-icons';
import {
  AppInstallationParameters,
  CLOSED_HOURS,
  ClockFormat,
  DEFAULT_HOURS,
  HoursOfOperation,
  DAYS_OF_WEEK,
  DAY_LABELS,
  DayHours,
} from '../types';
import { normalizeHours } from '../utils/hours';
import { formatDisplayTime } from '../utils/time';

function formatTimeSlot(
  slot: { open: string; close: string },
  clockFormat: AppInstallationParameters['clockFormat'] = '12h'
): string {
  return `${formatDisplayTime(slot.open, clockFormat)} - ${formatDisplayTime(
    slot.close,
    clockFormat
  )}`;
}

/**
 * Formats a day's hours into an array of display strings.
 * Returns multiple strings when a day has multiple time slots (e.g., lunch break).
 */
function formatDayHours(
  dayHours: DayHours,
  clockFormat: AppInstallationParameters['clockFormat'] = '12h'
): string[] {
  if (!dayHours.isOpen) {
    return ['Closed'];
  }
  if (dayHours.is24Hours) {
    return ['Open 24 hours'];
  }
  return dayHours.slots.map((slot) => formatTimeSlot(slot, clockFormat));
}

function getEntryClockFormatKey(sdk: FieldAppSDK) {
  return `operating-hours:clock-format:${sdk.ids.space}:${sdk.ids.environment}:${sdk.ids.entry}:${sdk.ids.field}`;
}

function readSavedClockFormat(sdk: FieldAppSDK): ClockFormat | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const savedFormat = window.localStorage.getItem(getEntryClockFormatKey(sdk));
  return savedFormat === '12h' || savedFormat === '24h' ? savedFormat : null;
}

function Field() {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();
  const installationParameters = sdk.parameters.installation as AppInstallationParameters;
  const defaultClockFormat = installationParameters.clockFormat ?? '12h';
  const configuredDefaultHours =
    installationParameters.useCustomDefaults && installationParameters.defaultHours
      ? normalizeHours(installationParameters.defaultHours, DEFAULT_HOURS)
      : CLOSED_HOURS;
  const [clockFormat, setClockFormat] = useState<ClockFormat>(
    () => readSavedClockFormat(sdk) ?? defaultClockFormat
  );

  const [hours, setHours] = useState<HoursOfOperation>(() => {
    const value = sdk.field.getValue();
    return value && typeof value === 'object'
      ? normalizeHours(value as HoursOfOperation, configuredDefaultHours)
      : configuredDefaultHours;
  });

  const handleClockFormatChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextClockFormat = event.target.value as ClockFormat;
      setClockFormat(nextClockFormat);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getEntryClockFormatKey(sdk), nextClockFormat);
      }
    },
    [sdk]
  );

  const handleEditHours = useCallback(async () => {
    const result = await sdk.dialogs.openCurrentApp({
      parameters: { hours, clockFormat } as unknown as SerializedJSONValue,
    });
    if (result) {
      setHours(result as HoursOfOperation);
      sdk.field.setValue(result);
    }
  }, [sdk, hours, clockFormat]);

  const openDaysCount = DAYS_OF_WEEK.filter((day) => hours[day].isOpen).length;

  return (
    <Box>
      <Stack flexDirection="column" spacing="spacingS" alignItems="flex-start">
        <Stack flexDirection="row" spacing="spacingS" alignItems="center" flexWrap="wrap">
          <Button variant="secondary" startIcon={<ClockIcon />} onClick={handleEditHours}>
            Edit hours of operation
          </Button>
          <Badge variant={openDaysCount > 0 ? 'positive' : 'secondary'}>
            {openDaysCount} {openDaysCount === 1 ? 'day' : 'days'} open
          </Badge>
        </Stack>

        <Box style={{ width: '100%', maxWidth: '220px' }}>
          <FormControl>
            <FormControl.Label>Time display format</FormControl.Label>
            <Select value={clockFormat} onChange={handleClockFormatChange}>
              <Select.Option value="12h">12-hour clock</Select.Option>
              <Select.Option value="24h">24-hour clock</Select.Option>
            </Select>
          </FormControl>
        </Box>

        <Box
          style={{
            width: '100%',
            backgroundColor: '#f7f9fa',
            borderRadius: '4px',
            padding: '12px',
          }}>
          <Stack flexDirection="column" spacing="spacingXs" alignItems="flex-start">
            {DAYS_OF_WEEK.map((day) => (
              <Stack
                key={day}
                flexDirection="row"
                justifyContent="flex-start"
                alignItems="flex-start"
                spacing="spacingL">
                <Text
                  fontWeight="fontWeightMedium"
                  fontColor="gray900"
                  style={{ width: '90px', flexShrink: 0 }}>
                  {DAY_LABELS[day]}
                </Text>
                <Stack flexDirection="column" spacing="none">
                  {formatDayHours(hours[day], clockFormat).map((line, index) => (
                    <Text key={index} fontColor="gray700" style={{ textAlign: 'left' }}>
                      {line}
                    </Text>
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

export default Field;
