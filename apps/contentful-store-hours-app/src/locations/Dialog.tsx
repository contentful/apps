import { useState, useEffect, useCallback } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Button, Stack, Flex } from '@contentful/f36-components';
import { css } from 'emotion';
import DayRow from '../components/DayRow';
import {
  HoursOfOperation,
  DayOfWeek,
  DayHours,
  DAYS_OF_WEEK,
  DEFAULT_SLOT,
  DialogInvocationParameters,
} from '../types';

const styles = {
  container: css({
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr auto',
    height: '100vh',
    padding: '20px',
    boxSizing: 'border-box',
    gap: '12px',
  }),
  header: css({
    marginBottom: '16px',
  }),
  title: css({
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  }),
  subtitle: css({
    fontSize: '14px',
    color: '#666',
    margin: 0,
  }),
  content: css({
    minHeight: 0,
    overflowY: 'auto',
    paddingRight: '4px',
  }),
  footer: css({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    position: 'sticky',
    bottom: 0,
  }),
};

function Dialog() {
  const sdk = useSDK<DialogAppSDK>();
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Hours of Operation</h1>
        <p className={styles.subtitle}>Set the hours your business is open</p>
      </div>

      <Flex justifyContent="flex-end" gap="spacingS" style={{ marginBottom: '8px' }}>
        <Button
          variant="secondary"
          size="small"
          onClick={allClosed ? handleSetAllOpen : handleSetAllClosed}>
          {allClosed ? 'Set All Open' : 'Set All Closed'}
        </Button>
      </Flex>

      <div className={styles.content}>
        <Stack flexDirection="column" spacing="spacingXs">
          {DAYS_OF_WEEK.map((day) => (
            <DayRow
              key={day}
              day={day}
              dayHours={hours[day]}
              onChange={(dayHours) => handleDayChange(day, dayHours)}
              onCopyToAll={() => handleCopyToAll(day)}
              onCopyToWeekdays={() => handleCopyToWeekdays(day)}
            />
          ))}
        </Stack>
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Save Hours
        </Button>
      </div>
    </div>
  );
}

export default Dialog;
