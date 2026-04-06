import { useCallback, useMemo } from 'react';
import { Flex, Select, IconButton, Text } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { ClockFormat, TimeSlot } from '../types';
import { compareTimeValues, getTimeOptions } from '../utils/time';

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
  const openTimeOptions = useMemo(
    () => timeOptions.filter((option) => compareTimeValues(option.value, slot.close) < 0),
    [slot.close, timeOptions]
  );
  const closeTimeOptions = useMemo(
    () => timeOptions.filter((option) => compareTimeValues(option.value, slot.open) > 0),
    [slot.open, timeOptions]
  );

  const handleOpenChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const nextOpen = e.target.value;
      const nextClose =
        compareTimeValues(nextOpen, slot.close) < 0
          ? slot.close
          : timeOptions.find((option) => compareTimeValues(option.value, nextOpen) > 0)?.value ??
            slot.close;

      onChange({
        ...slot,
        open: nextOpen,
        close: nextClose,
      });
    },
    [slot, onChange, timeOptions]
  );

  const handleCloseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const nextClose = e.target.value;
      const nextOpen =
        compareTimeValues(slot.open, nextClose) < 0
          ? slot.open
          : [...timeOptions]
              .reverse()
              .find((option) => compareTimeValues(option.value, nextClose) < 0)?.value ?? slot.open;

      onChange({
        ...slot,
        open: nextOpen,
        close: nextClose,
      });
    },
    [slot, onChange, timeOptions]
  );

  return (
    <Flex
      alignItems="center"
      gap="spacingS"
      style={{
        display: 'grid',
        gridTemplateColumns: canRemove
          ? 'minmax(0, 1fr) auto minmax(0, 1fr) auto'
          : 'minmax(0, 1fr) auto minmax(0, 1fr)',
        width: '100%',
        maxWidth: '520px',
        justifyItems: 'stretch',
      }}>
      <Select
        id="open-time"
        value={slot.open}
        onChange={handleOpenChange}
        size="small"
        style={{ minWidth: 0, width: '100%' }}
        aria-label="Open time">
        {openTimeOptions.map((option) => (
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
        style={{ minWidth: 0, width: '100%' }}
        aria-label="Close time">
        {closeTimeOptions.map((option) => (
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
