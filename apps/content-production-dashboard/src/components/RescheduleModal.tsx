import { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  FormControl,
  Autocomplete,
  Button,
  Flex,
  Note,
  Box,
} from '@contentful/f36-components';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import type { ReleaseWithScheduledAction } from '../utils/fetchReleases';
import { Datepicker } from '@contentful/f36-datepicker';

interface RescheduleModalProps {
  isShown: boolean;
  onClose: () => void;
  release: ReleaseWithScheduledAction | null;
  sdk: HomeAppSDK | PageAppSDK;
  onSuccess: () => void;
  testId: string;
}

type TimezoneOption = {
  value: string;
  display: string;
};

const formatToPMAM = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    if (hours === 0) hours = 12;
    
    // Round to nearest 30 minutes
    const roundedMinutes = minutes < 30 ? 0 : 30;
    
    return `${hours}:${String(roundedMinutes).padStart(2, '0')} ${period}`;
  } catch {
    return '';
  }
};

const parseTimeToDate = (date: Date, timeString: string): Date => {
  const [timePart, period] = timeString.split(' ');
  const [hours, minutes] = timePart.split(':');
  let hour24 = parseInt(hours, 10);
  
  // Convert to 24-hour format
  if (period.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  const newDate = new Date(date);
  newDate.setHours(hour24, parseInt(minutes, 10), 0, 0);
  return newDate;
};

// Generate time options in 30-minute increments
const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const period = hour >= 12 ? 'PM' : 'AM';
      let displayHour = hour % 12;
      if (displayHour === 0) displayHour = 12;
      options.push(`${displayHour}:${String(minute).padStart(2, '0')} ${period}`);
    }
  }
  return options;
};


const generateTimezoneOptions = () => {
  return Intl.supportedValuesOf('timeZone').map((tz) => {
    const date = new Date();
    const utcOffset = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset'
    }).format(date).split(' ').pop();
    
    return {
      value: tz,
      display: `${tz} (${utcOffset})`
    };
  });
};

export const RescheduleModal = ({ isShown, onClose, release, sdk, onSuccess, testId }: RescheduleModalProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Memoize options to avoid recalculating on every render
  const allTimeOptions = useMemo(() => generateTimeOptions(), []);
  const allTimezoneOptions = useMemo(() => generateTimezoneOptions(), []);
  
  // State for filtered options
  const [filteredTimeOptions, setFilteredTimeOptions] = useState<string[]>([]);
  const [filteredTimezoneOptions, setFilteredTimezoneOptions] = useState<TimezoneOption[]>([]);

  useEffect(() => {
    if (release && isShown) {
      setDate(new Date(release.scheduledFor.datetime));
      setTime(formatToPMAM(release.scheduledFor.datetime));
      setTimezone(release.scheduledFor.timezone || 'UTC');
      setError(null);
      setFilteredTimeOptions(allTimeOptions);
      setFilteredTimezoneOptions(allTimezoneOptions);
    }
  }, [release?.scheduledFor.datetime, release?.scheduledFor.timezone, isShown, allTimeOptions, allTimezoneOptions]);

  // Filter time options
  const handleTimeInputChange = (value: string) => {
    const filtered = allTimeOptions.filter((option) =>
      option.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTimeOptions(filtered);
  };

  // Filter timezone options
  const handleTimezoneInputChange = (value: string) => {
    const filtered = allTimezoneOptions.filter((option) =>
      option.display.toLowerCase().includes(value.toLowerCase()) ||
      option.value.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTimezoneOptions(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {

    if (!date || !time || !release || time.trim() === '' || !timezone) {
      setError('Date, time, and release are required for rescheduling');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get the scheduled action to retrieve its version
      const scheduledAction = await sdk.cma.scheduledActions.get({
        scheduledActionId: release.scheduledActionId,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
      });

      // Parse the time and create a new Date object
      const newDate = parseTimeToDate(date, time);
      
      // Validate that the new date is in the future
      if (newDate <= new Date()) {
        throw new Error('Scheduled date and time must be in the future');
      }
      
      // Format the date in ISO 8601 format
      const isoDate = newDate.toISOString();

      // Update the scheduled action
      await sdk.cma.scheduledActions.update(
        {
          scheduledActionId: release.scheduledActionId,
          spaceId: sdk.ids.space,
          version: scheduledAction.sys.version,
        },
        {
          action: scheduledAction.action,
          entity: scheduledAction.entity,
          environment: scheduledAction.environment,
          scheduledFor: {
            datetime: isoDate,
            timezone,
          },
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to reschedule release:', err);
      setError(err instanceof Error ? err.message : 'Failed to reschedule release');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!release) return null;

  return (
    <Modal isShown={isShown} onClose={onClose} size="medium" testId={testId}>
      {() => (
        <>
          <Modal.Header title="Edit Schedule" onClose={onClose} />
          <Modal.Content>
            <form onSubmit={handleSubmit}>
              <Flex flexDirection="column" gap="spacingM">
                <Flex gap="spacingM" alignItems="flex-start">
                  <Box flex={1}>
                    <FormControl isRequired>
                      <FormControl.Label>Publish on</FormControl.Label>
                      <Datepicker
                    selected={date || undefined}
                    onSelect={(date: Date | undefined) => setDate(date || undefined)}
                    dateFormat="dd MMM yyyy"
                  />
                    </FormControl>
                  </Box>
                  <Box>
                    <FormControl isRequired isInvalid={!!error}>
                      <FormControl.Label>Time</FormControl.Label>
                      <Autocomplete
                        items={filteredTimeOptions}
                        onInputValueChange={handleTimeInputChange}
                        onSelectItem={(item) => setTime(item)}
                        selectedItem={time}
                        listMaxHeight={100}
                        listWidth="full"
                        placeholder="Select time"
                        usePortal={true}
                      />
                      {error && (
                        <FormControl.ValidationMessage>
                          {error}
                        </FormControl.ValidationMessage>
                      )}
                    </FormControl>
                  </Box>
                </Flex>
                <FormControl isRequired isInvalid={!!error}>
                  <FormControl.Label>Time zone</FormControl.Label>
                  <Autocomplete<TimezoneOption>
                    items={filteredTimezoneOptions}
                    onInputValueChange={handleTimezoneInputChange}
                    onSelectItem={(item) => setTimezone(item.value)}
                    selectedItem={allTimezoneOptions.find(tz => tz.value === timezone)}
                    itemToString={(item) => item.display}
                    renderItem={(item) => item.display}
                    listMaxHeight={120}
                    placeholder="Select timezone"
                    usePortal={true}
                  />
                </FormControl>
              </Flex>
            </form>
          </Modal.Content>
          <Modal.Controls>
            <Flex justifyContent="flex-end" gap="spacingS">
              <Button variant="secondary" onClick={onClose} isDisabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isDisabled={isSubmitting || !!error}
                isLoading={isSubmitting}>
                Set Schedule
              </Button>
            </Flex>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};