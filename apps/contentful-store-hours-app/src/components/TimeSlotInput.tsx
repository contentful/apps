import { useCallback } from 'react';
import { Flex, Select, IconButton, Text } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { TimeSlot } from '../types';

interface TimeSlotInputProps {
  slot: TimeSlot;
  onChange: (slot: TimeSlot) => void;
  onRemove: () => void;
  canRemove: boolean;
}

/**
 * Generates an array of time options for the dropdown selectors.
 * Creates intervals from 12:00 AM to 11:59 PM.
 *
 * @returns Array of options with:
 *   - value: 24-hour format string ("HH:MM") for storage
 *   - label: 12-hour format string ("H:MM AM/PM") for display
 *
 * Example output:
 *   [
 *     { value: "00:00", label: "12:00 AM" },
 *     { value: "00:30", label: "12:30 AM" },
 *     { value: "01:00", label: "1:00 AM" },
 *     ...
 *     { value: "23:30", label: "11:30 PM" },
 *     { value: "23:59", label: "11:59 PM" }  // Special case for "end of day"
 *   ]
 */

/** Interval in minutes between time options (e.g., 30 for half-hour, 15 for quarter-hour) */
const TIME_INTERVAL_MINUTES = 30;

function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];

  // Generate intervals for all 24 hours
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += TIME_INTERVAL_MINUTES) {
      // Value is stored in 24-hour format for consistency
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      // Label converts to 12-hour format for user-friendly display
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12; // 0 → 12, 13 → 1, etc.
      const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;

      options.push({ value, label });
    }
  }

  // Add 11:59 PM as a special "end of day" option
  // (useful for businesses that close at midnight)
  options.push({ value: '23:59', label: '11:59 PM' });

  return options;
}

/** Pre-computed time options to avoid regenerating on each render */
const TIME_OPTIONS = generateTimeOptions();

/**
 * A time slot input component with open/close time dropdowns.
 * Allows users to select a time range and optionally remove the slot.
 */
function TimeSlotInput({ slot, onChange, onRemove, canRemove }: TimeSlotInputProps) {
  const handleOpenChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({
        ...slot,
        open: e.target.value,
      });
    },
    [slot, onChange]
  );

  const handleCloseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({
        ...slot,
        close: e.target.value,
      });
    },
    [slot, onChange]
  );

  return (
    <Flex alignItems="center" gap="spacingS">
      <Select
        id="open-time"
        value={slot.open}
        onChange={handleOpenChange}
        size="small"
        style={{ minWidth: '110px' }}>
        {TIME_OPTIONS.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
      <Text fontColor="gray600">to</Text>
      <Select
        id="close-time"
        value={slot.close}
        onChange={handleCloseChange}
        size="small"
        style={{ minWidth: '110px' }}>
        {TIME_OPTIONS.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
      {canRemove && (
        <IconButton
          variant="transparent"
          icon={<CloseIcon />}
          aria-label="Remove time slot"
          size="small"
          onClick={onRemove}
        />
      )}
    </Flex>
  );
}

export default TimeSlotInput;
