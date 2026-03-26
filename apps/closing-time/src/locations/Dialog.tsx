import { useState, useEffect, useCallback } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Button, Stack, Flex, Modal } from '@contentful/f36-components';
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
  content: css({
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }),
};

function Dialog() {
  const sdk = useSDK<DialogAppSDK>();
  const installationParameters = sdk.parameters.installation as AppInstallationParameters;
  const clockFormat = installationParameters.clockFormat ?? '12h';
  const invocationParams = sdk.parameters.invocation as unknown as DialogInvocationParameters;
  const initialHours = invocationParams?.hours || ({} as HoursOfOperation);

  const [hours, setHours] = useState<HoursOfOperation>(initialHours);

  useEffect(() => {
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
  const copyHoursTodays = useCallback(
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
    (sourceDay: DayOfWeek) => copyHoursTodays(sourceDay, [...DAYS_OF_WEEK]),
    [copyHoursTodays]
  );

  /** Copies hours from one day to weekdays only (Mon-Fri) */
  const handleCopyToWeekdays = useCallback(
    (sourceDay: DayOfWeek) =>
      copyHoursTodays(sourceDay, ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
    [copyHoursTodays]
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
    <Modal isShown onClose={handleCancel} size="fullscreen">
      {() => (
        <>
          <Modal.Header title="Hours of operation" onClose={handleCancel} />
          <Modal.Content className={styles.content}>
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
          </Modal.Content>
          <Modal.Controls>
            <Button variant="transparent" size="small" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" size="small" onClick={handleConfirm}>
              Save hours
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

export default Dialog;
