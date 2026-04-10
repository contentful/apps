import { useState, useLayoutEffect, useCallback } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Button, Stack, Flex, Box, Heading, IconButton } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { css } from 'emotion';
import DayRow from '../components/DayRow';
import {
  AppInstallationParameters,
  HoursOfOperation,
  DayOfWeek,
  DayHours,
  DAYS_OF_WEEK,
  DEFAULT_SLOT,
  DialogInvocationParameters,
} from '../types';

const styles = {
  root: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxHeight: '100vh',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  }),
  header: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #e5ebf1',
    flexShrink: 0,
  }),
  content: css({
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  }),
  controls: css({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexShrink: 0,
    padding: '20px 24px 24px',
    borderTop: '1px solid #e5ebf1',
    backgroundColor: '#ffffff',
  }),
};

function Dialog() {
  const sdk = useSDK<DialogAppSDK>();
  const installationParameters = sdk.parameters.installation as AppInstallationParameters;
  const invocationParams = sdk.parameters.invocation as unknown as DialogInvocationParameters;
  const clockFormat = invocationParams?.clockFormat ?? installationParameters.clockFormat ?? '12h';
  const initialHours = invocationParams?.hours || ({} as HoursOfOperation);

  const [hours, setHours] = useState<HoursOfOperation>(initialHours);

  useLayoutEffect(() => {
    sdk.window.stopAutoResizer();
    sdk.window.updateHeight(800);
  }, [sdk.window]);

  const handleDayChange = useCallback((day: DayOfWeek, dayHours: DayHours) => {
    setHours((prev) => ({
      ...prev,
      [day]: dayHours,
    }));
  }, []);

  /**
   * Copies the hours configuration from a source day to specified target days.
   * Deep copies the slots array to avoid shared references between days.
   */
  const copyHoursToDays = useCallback(
    (sourceDay: DayOfWeek, targetDays: DayOfWeek[]) => {
      const sourceHours = hours[sourceDay];

      setHours((prev) => {
        const updated = { ...prev };
        targetDays.forEach((day) => {
          updated[day] = {
            isOpen: sourceHours.isOpen,
            is24Hours: sourceHours.is24Hours,
            slots: sourceHours.slots.map((slot) => ({ ...slot })),
          };
        });
        return updated;
      });
    },
    [hours]
  );

  /** Copies hours from one day to all days of the week */
  const handleCopyToAll = useCallback(
    (sourceDay: DayOfWeek) => copyHoursToDays(sourceDay, [...DAYS_OF_WEEK]),
    [copyHoursToDays]
  );

  /** Copies hours from one day to weekdays only (Mon-Fri) */
  const handleCopyToWeekdays = useCallback(
    (sourceDay: DayOfWeek) =>
      copyHoursToDays(sourceDay, ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
    [copyHoursToDays]
  );

  const handleSetAllClosed = useCallback(() => {
    setHours((prev) => {
      const updated = { ...prev };
      DAYS_OF_WEEK.forEach((day) => {
        updated[day] = {
          isOpen: false,
          is24Hours: false,
          slots: [{ ...DEFAULT_SLOT }],
        };
      });
      return updated;
    });
  }, []);

  const handleSetAllOpen = useCallback(() => {
    setHours((prev) => {
      const updated = { ...prev };
      DAYS_OF_WEEK.forEach((day) => {
        updated[day] = {
          isOpen: true,
          is24Hours: false,
          slots: [{ ...DEFAULT_SLOT }],
        };
      });
      return updated;
    });
  }, []);

  const allClosed = DAYS_OF_WEEK.every((day) => !hours[day].isOpen);

  const handleConfirm = useCallback(() => {
    // Clean up data before saving
    const cleanedHours: HoursOfOperation = {} as HoursOfOperation;
    DAYS_OF_WEEK.forEach((day) => {
      const dayHours = hours[day];
      if (!dayHours.isOpen) {
        // Closed: force is24Hours to false and remove slots
        cleanedHours[day] = {
          isOpen: false,
          is24Hours: false,
          slots: [],
        };
      } else if (dayHours.is24Hours) {
        // Open 24 hours: remove slots
        cleanedHours[day] = {
          isOpen: true,
          is24Hours: true,
          slots: [],
        };
      } else {
        // Regular hours: keep slots
        cleanedHours[day] = dayHours;
      }
    });
    sdk.close(cleanedHours);
  }, [sdk, hours]);

  const handleCancel = useCallback(() => {
    sdk.close(null);
  }, [sdk]);

  return (
    <Box className={styles.root}>
      <Box className={styles.header}>
        <Heading marginBottom="none">Hours of operation</Heading>
        <IconButton
          variant="transparent"
          icon={<CloseIcon />}
          aria-label="Close dialog"
          onClick={handleCancel}
        />
      </Box>

      <Box className={styles.content}>
        <Flex justifyContent="flex-end">
          <Button
            variant="secondary"
            size="small"
            onClick={allClosed ? handleSetAllOpen : handleSetAllClosed}>
            {allClosed ? 'Set all open' : 'Set all closed'}
          </Button>
        </Flex>

        <Stack
          flexDirection="column"
          spacing="spacingXs"
          alignItems="stretch"
          style={{ width: '100%' }}>
          {DAYS_OF_WEEK.map((day) => (
            <DayRow
              key={day}
              day={day}
              dayHours={hours[day]}
              onChange={(dayHours) => handleDayChange(day, dayHours)}
              onCopyToAll={() => handleCopyToAll(day)}
              onCopyToWeekdays={() => handleCopyToWeekdays(day)}
              clockFormat={clockFormat}
            />
          ))}
        </Stack>
      </Box>

      <Box className={styles.controls}>
        <Button variant="transparent" size="small" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="small" onClick={handleConfirm}>
          Save hours
        </Button>
      </Box>
    </Box>
  );
}

export default Dialog;
