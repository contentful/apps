import { useCallback } from 'react';
import { Flex, Select, IconButton, Text } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { ClockFormat, TimeSlot } from '../types';
import { getTimeOptions } from '../utils/time';

interface TimeSlotInputProps {
  slot: TimeSlot;
  onChange: (slot: TimeSlot) => void;
  onRemove: () => void;
  canRemove: boolean;
  clockFormat?: ClockFormat;
}

/**
 * A time slot input component with open/close time dropdowns.
 * Allows users to select a time range and optionally remove the slot.
 */
function TimeSlotInput({
  slot,
  onChange,
  onRemove,
  canRemove,
  clockFormat = '12h',
}: TimeSlotInputProps) {
  const timeOptions = getTimeOptions(clockFormat);

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
        style={{ minWidth: '110px' }}
        aria-label="Open time">
        {timeOptions.map((option) => (
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
        style={{ minWidth: '110px' }}
        aria-label="Close time">
        {timeOptions.map((option) => (
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
