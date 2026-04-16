import React, { useMemo, useState } from 'react';
import { Box, Button, Datepicker, Flex, FormControl } from '@contentful/f36-components';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { CustomRangeDialogInvocationParams, StartEndDates } from 'types';
import { formatDate, parseDateString } from 'helpers/DateRangeHelpers/DateRangeHelpers';

const Dialog = () => {
  const sdk = useSDK<DialogExtensionSDK<unknown, CustomRangeDialogInvocationParams>>();
  const invocationParams = sdk.parameters.invocation;

  const initialDates = useMemo<StartEndDates>(() => {
    if (invocationParams?.mode === 'customDateRange') {
      return {
        start: invocationParams.startDate,
        end: invocationParams.endDate,
      };
    }

    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);

    return {
      start: formatDate(oneWeekAgo),
      end: formatDate(today),
    };
  }, [invocationParams]);

  const [startDate, setStartDate] = useState<Date | undefined>(parseDateString(initialDates.start));
  const [endDate, setEndDate] = useState<Date | undefined>(parseDateString(initialDates.end));

  return (
    <Box padding="spacingM">
      <Flex flexDirection="column" gap="spacingM">
        <Flex gap="spacingM" alignItems="flex-start">
          <FormControl style={{ flex: 1, marginBottom: 0 }}>
            <FormControl.Label>From</FormControl.Label>
            <Datepicker
              selected={startDate}
              onSelect={setStartDate}
              toDate={endDate}
              inputProps={{ isReadOnly: true }}
              popoverProps={{
                usePortal: true,
                placement: 'bottom-start',
                isAutoalignmentEnabled: true,
              }}
            />
          </FormControl>
          <FormControl style={{ flex: 1, marginBottom: 0 }}>
            <FormControl.Label>To</FormControl.Label>
            <Datepicker
              selected={endDate}
              onSelect={setEndDate}
              fromDate={startDate}
              toDate={new Date()}
              inputProps={{ isReadOnly: true }}
              popoverProps={{
                usePortal: true,
                placement: 'bottom-end',
                isAutoalignmentEnabled: true,
              }}
            />
          </FormControl>
        </Flex>
        <Flex justifyContent="flex-end" gap="spacingS">
          <Button variant="secondary" onClick={() => sdk.close()}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!startDate || !endDate) return;

              sdk.close({
                start: formatDate(startDate),
                end: formatDate(endDate),
              });
            }}
            isDisabled={!startDate || !endDate}>
            Apply
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Dialog;
