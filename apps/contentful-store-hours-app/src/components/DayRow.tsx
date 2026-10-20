import { useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Switch,
  Checkbox,
  Button,
  IconButton,
  Menu,
} from '@contentful/f36-components';
import { PlusIcon, MoreHorizontalIcon } from '@contentful/f36-icons';
import TimeSlotInput from './TimeSlotInput';
import { DayOfWeek, DayHours, DAY_LABELS, DEFAULT_SLOT, TimeSlot } from '../types';

interface DayRowProps {
  day: DayOfWeek;
  dayHours: DayHours;
  onChange: (dayHours: DayHours) => void;
  onCopyToAll: () => void;
  onCopyToWeekdays: () => void;
}

function DayRow({ day, dayHours, onChange, onCopyToAll, onCopyToWeekdays }: DayRowProps) {
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      onChange({
        ...dayHours,
        isOpen,
      });
    },
    [dayHours, onChange]
  );

  const handle24HoursChange = useCallback(
    (is24Hours: boolean) => {
      onChange({
        ...dayHours,
        is24Hours,
      });
    },
    [dayHours, onChange]
  );

  const handleSlotChange = useCallback(
    (index: number, slot: TimeSlot) => {
      const newSlots = [...dayHours.slots];
      newSlots[index] = slot;
      onChange({
        ...dayHours,
        slots: newSlots,
      });
    },
    [dayHours, onChange]
  );

  const handleAddSlot = useCallback(() => {
    const lastSlot = dayHours.slots[dayHours.slots.length - 1];
    const newOpen = lastSlot ? lastSlot.close : '09:00';
    const newClose = lastSlot ? '21:00' : '17:00';
    onChange({
      ...dayHours,
      slots: [...dayHours.slots, { open: newOpen, close: newClose }],
    });
  }, [dayHours, onChange]);

  const handleRemoveSlot = useCallback(
    (index: number) => {
      if (dayHours.slots.length <= 1) {
        onChange({
          ...dayHours,
          slots: [{ ...DEFAULT_SLOT }],
        });
        return;
      }
      const newSlots = dayHours.slots.filter((_, i) => i !== index);
      onChange({
        ...dayHours,
        slots: newSlots,
      });
    },
    [dayHours, onChange]
  );

  return (
    <Box
      style={{
        borderBottom: '1px solid #e5e5e5',
        paddingBottom: '12px',
        paddingTop: '4px',
      }}>
      <Flex alignItems="flex-start" justifyContent="space-between" gap="spacingM">
        {/* Day name and toggle */}
        <Flex alignItems="center" gap="spacingS" style={{ minWidth: '110px', paddingTop: '4px' }}>
          <Switch
            id={`${day}-open`}
            isChecked={dayHours.isOpen}
            onChange={() => handleOpenChange(!dayHours.isOpen)}
            size="small"
          />
          <Text fontWeight="fontWeightMedium" fontColor={dayHours.isOpen ? 'gray900' : 'gray500'}>
            {DAY_LABELS[day]}
          </Text>
        </Flex>

        {/* 24 hours checkbox - fixed width column */}
        <Flex alignItems="center" style={{ minWidth: '120px', paddingTop: '4px' }}>
          {dayHours.isOpen ? (
            <Checkbox
              id={`${day}-24hours`}
              isChecked={dayHours.is24Hours}
              onChange={() => handle24HoursChange(!dayHours.is24Hours)}>
              Open 24 hours
            </Checkbox>
          ) : (
            <Text fontColor="gray500">Closed</Text>
          )}
        </Flex>

        {/* Time slots - fixed position, hidden when 24 hours or closed */}
        <Flex
          flexGrow={1}
          alignItems="center"
          gap="spacingS"
          flexWrap="wrap"
          style={{
            minHeight: '32px',
            visibility: dayHours.isOpen && !dayHours.is24Hours ? 'visible' : 'hidden',
          }}>
          {dayHours.slots.map((slot, index) => (
            <TimeSlotInput
              key={index}
              slot={slot}
              onChange={(newSlot) => handleSlotChange(index, newSlot)}
              onRemove={() => handleRemoveSlot(index)}
              canRemove={dayHours.slots.length > 1}
            />
          ))}
          <Button variant="secondary" size="small" startIcon={<PlusIcon />} onClick={handleAddSlot}>
            Add hours
          </Button>
        </Flex>

        {/* Menu */}
        <Box style={{ paddingTop: '4px' }}>
          <Menu>
            <Menu.Trigger>
              <IconButton
                variant="transparent"
                icon={<MoreHorizontalIcon />}
                aria-label="More options"
                size="small"
              />
            </Menu.Trigger>
            <Menu.List>
              <Menu.Item onClick={onCopyToAll}>Copy to all days</Menu.Item>
              <Menu.Item onClick={onCopyToWeekdays}>Copy to weekdays</Menu.Item>
            </Menu.List>
          </Menu>
        </Box>
      </Flex>
    </Box>
  );
}

export default DayRow;
