import { useState, useEffect } from 'react';
import {
  Modal,
  FormControl,
  TextInput,
  Select,
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
}

const formatDateForInput = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

const formatTimeForInput = (dateString: string): string => {
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

export const RescheduleModal = ({ isShown, onClose, release, sdk, onSuccess }: RescheduleModalProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (release && isShown) {
      setDate(new Date(release.scheduledFor.datetime));
      setTime(formatTimeForInput(release.scheduledFor.datetime));
      setTimezone(release.scheduledFor.timezone || 'UTC');
      setError(null);
    }
  }, [release?.scheduledFor.datetime, release?.scheduledFor.timezone, isShown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!release || !date || !time) {
      setError('Date and time are required');
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

            // Parse the time in 12-hour format
            const [timePart, period] = time.split(' ');
            const [hours, minutes] = timePart.split(':');
            let hour24 = parseInt(hours, 10);
            
            // Convert to 24-hour format
            if (period.toUpperCase() === 'PM' && hour24 !== 12) {
              hour24 += 12;
            } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
              hour24 = 0;
            }
      
            // Create a new Date object with the selected date and time
            const newDate = new Date(date);
            newDate.setHours(hour24, parseInt(minutes, 10), 0, 0);
      
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
    <Modal isShown={isShown} onClose={onClose} size="medium">
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
                  <Box flex={1}>
                    <FormControl>
                      <FormControl.Label>Time</FormControl.Label>
                      <Select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      >
                        {generateTimeOptions().map((timeOption) => (
                          <Select.Option key={timeOption} value={timeOption}>
                            {timeOption}
                          </Select.Option>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Flex>
                <FormControl>
                  <FormControl.Label>Time zone</FormControl.Label>
                  <Select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    
                  >
                    {Intl.supportedValuesOf('timeZone').map((tz) => {
                      // Get UTC offset for the timezone
                      const date = new Date();
                      const utcOffset = new Intl.DateTimeFormat('en-US', {
                        timeZone: tz,
                        timeZoneName: 'longOffset'
                      }).format(date).split(' ').pop();
                      
                      return (
                        <Select.Option key={tz} value={tz}>
                          {`${tz} (${utcOffset})`}
                        </Select.Option>
                      );
                    })}
                  </Select>
                </FormControl>
                {error && (
                  <Note variant="negative" title="Error">
                    {error}
                  </Note>
                )}
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
                isDisabled={isSubmitting || !date || !time}
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

