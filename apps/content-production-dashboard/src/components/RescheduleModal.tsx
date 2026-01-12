import { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  FormControl,
  Autocomplete,
  Button,
  Flex,
  Box,
} from '@contentful/f36-components';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import type { ReleaseWithScheduledAction } from '../utils/fetchReleases';
import { Datepicker } from '@contentful/f36-datepicker';
import { Validator } from '../utils/Validator';

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
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState<TimezoneOption>({ value: 'UTC', display: 'UTC' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filteredTimeOptions, setFilteredTimeOptions] = useState<string[]>([]);
  const [filteredTimezoneOptions, setFilteredTimezoneOptions] = useState<TimezoneOption[]>([]);
  
  const allTimeOptions = useMemo(() => generateTimeOptions(), []);
  const allTimezoneOptions = useMemo(() => generateTimezoneOptions(), []);


  useEffect(() => {
    if (release && isShown) {
      setDate(new Date(release.scheduledFor.datetime));
      setTime(formatToPMAM(release.scheduledFor.datetime));
      setTimezone({ value: release.scheduledFor.timezone || 'UTC', display: allTimezoneOptions.find(tz => tz.value === release.scheduledFor.timezone)?.display || '' });
      setErrors({});
      setFilteredTimeOptions(allTimeOptions);
      setFilteredTimezoneOptions(allTimezoneOptions);
    }
  }, [release, isShown]);

  // Filter time options
  const handleTimeInputChange = (value: string) => {
    const filtered = allTimeOptions.filter((option) =>
      option.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTimeOptions(filtered);
    
    // Clear the selected time if the input is cleared
    if (!value || value.trim() === '') {
      setTime('');
    }
    
    // Clear error if field has value
    if (value && value.trim() !== '' && errors.time) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.time;
        return newErrors;
      });
    }
  };

  // Filter timezone options
  const handleTimezoneInputChange = (value: string) => {
    const filtered = allTimezoneOptions.filter((option) =>
      option.display.toLowerCase().includes(value.toLowerCase()) ||
      option.value.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTimezoneOptions(filtered);
    
    if (!value || value.trim() === '') {
      setTimezone({ value: '', display: '' });
    }
    
    if (value && value.trim() !== '' && errors.timezone) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.timezone;
        return newErrors;
      });
    }
  };

  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    Validator.isRequired(newErrors, date, 'date', 'Date');
    Validator.isRequired(newErrors, time, 'time', 'Time');
    Validator.isRequired(newErrors, timezone.value, 'timezone', 'Timezone');
    
    setErrors(newErrors);
    return Validator.hasErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!release) {
      return;
    }

    const hasErrors = validateFields();
    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the scheduled action to retrieve its version
      const scheduledAction = await sdk.cma.scheduledActions.get({
        scheduledActionId: release.scheduledActionId,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
      });

      const newDate = parseTimeToDate(date!, time);
      
      const isoDate = newDate.toISOString();

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
            timezone: timezone.value,
          },
        }
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to reschedule release:', err);
      let errorMessage = 'Failed to reschedule release';
      
      if (err?.code=== 'TooManyPendingJobs') {
        errorMessage = errorMessage + `You've exceeded the pending scheduled actions limit. `
      }
      
      sdk.notifier.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      onClose();
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
                    <FormControl isRequired isInvalid={!!errors.date}>
                      <FormControl.Label>Publish on</FormControl.Label>
                      <Datepicker
                        selected={date}
                        onSelect={(selectedDate: Date | undefined) => {
                          if (selectedDate) {
                            setDate(selectedDate);
                          }
                          if (errors.date) {
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.date;
                              return newErrors;
                            });
                          }
                        }}
                        fromDate={new Date()}
                        dateFormat="dd MMM yyyy"
                      />
                      {errors.date && (
                        <FormControl.ValidationMessage>
                          {errors.date}
                        </FormControl.ValidationMessage>
                      )}
                    </FormControl>
                  </Box>
                  <Box>
                    <FormControl isRequired isInvalid={!!errors.time}>
                      <FormControl.Label>Time</FormControl.Label>
                      <Autocomplete
                        items={filteredTimeOptions}
                        onInputValueChange={handleTimeInputChange}
                        onSelectItem={(item) => {
                          setTime(item);
                          if (errors.time) {
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.time;
                              return newErrors;
                            });
                          }
                        }}
                        selectedItem={time}
                        listMaxHeight={100}
                        listWidth="full"
                        placeholder="Select time"
                        usePortal={true}
                      />
                      {errors.time && (
                        <FormControl.ValidationMessage>
                          {errors.time}
                        </FormControl.ValidationMessage>
                      )}
                    </FormControl>
                  </Box>
                </Flex>
                <FormControl isRequired isInvalid={!!errors.timezone}>
                  <FormControl.Label>Time zone</FormControl.Label>
                  <Autocomplete<TimezoneOption>
                    items={filteredTimezoneOptions}
                    onInputValueChange={handleTimezoneInputChange}
                    onSelectItem={(item) => {
                      setTimezone(item);
                      if (errors.timezone) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.timezone;
                          return newErrors;
                        });
                      }
                    }}
                  selectedItem={timezone}
                    itemToString={(item) => item.display}
                    renderItem={(item) => item.display}
                    listMaxHeight={120}
                    placeholder="Select timezone"
                    usePortal={true}
                  />
                  {errors.timezone && (
                    <FormControl.ValidationMessage>
                      {errors.timezone}
                    </FormControl.ValidationMessage>
                  )}
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
                isDisabled={isSubmitting}
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