import { useState, useCallback } from 'react';
import { FieldAppSDK, SerializedJSONValue } from '@contentful/app-sdk';
import { useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import { Button, Stack, Text, Badge, Box } from '@contentful/f36-components';
import { ClockIcon } from '@contentful/f36-icons';
import { HoursOfOperation, DEFAULT_HOURS, DAYS_OF_WEEK, DAY_LABELS, DayHours } from '../types';

function formatTimeSlot(slot: { open: string; close: string }): string {
  /**
   * Converts 24-hour time string to 12-hour format with AM/PM.
   *
   * @param time - Time in 24-hour format, e.g., "14:30"
   * @returns Formatted time, e.g., "2:30 PM"
   *
   * Conversion logic:
   * - Hours 0-11 → AM, hours 12-23 → PM
   * - Hour 0 displays as 12 (midnight), hour 12 stays as 12 (noon)
   * - Hours 13-23 convert to 1-11 (e.g., 14 → 2)
   */
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    // Convert 24-hour to 12-hour: 0→12, 1-11→1-11, 12→12, 13-23→1-11
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  return `${formatTime(slot.open)} - ${formatTime(slot.close)}`;
}

/**
 * Formats a day's hours into an array of display strings.
 * Returns multiple strings when a day has multiple time slots (e.g., lunch break).
 */
function formatDayHours(dayHours: DayHours): string[] {
  if (!dayHours.isOpen) {
    return ['Closed'];
  }
  if (dayHours.is24Hours) {
    return ['Open 24 hours'];
  }
  return dayHours.slots.map(formatTimeSlot);
}

function Field() {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();

  const [hours, setHours] = useState<HoursOfOperation>(() => {
    const value = sdk.field.getValue();
    return value && typeof value === 'object' ? value : DEFAULT_HOURS;
  });

  const handleEditHours = useCallback(async () => {
    const result = await sdk.dialogs.openCurrentApp({
      parameters: { hours } as unknown as SerializedJSONValue,
    });
    if (result) {
      setHours(result as HoursOfOperation);
      sdk.field.setValue(result);
    }
  }, [sdk, hours]);

  const openDaysCount = DAYS_OF_WEEK.filter((day) => hours[day].isOpen).length;

  return (
    <Box>
      <Stack flexDirection="column" spacing="spacingS" alignItems="flex-start">
        <Stack flexDirection="row" spacing="spacingS" alignItems="center">
          <Button variant="secondary" startIcon={<ClockIcon />} onClick={handleEditHours}>
            Edit Hours of Operation
          </Button>
          <Badge variant={openDaysCount > 0 ? 'positive' : 'secondary'}>
            {openDaysCount} {openDaysCount === 1 ? 'day' : 'days'} open
          </Badge>
        </Stack>

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
                  {formatDayHours(hours[day]).map((line, index) => (
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
