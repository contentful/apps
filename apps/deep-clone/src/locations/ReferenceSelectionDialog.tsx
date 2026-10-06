import { useMemo, useState } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Paragraph,
  Stack,
  Text,
} from '@contentful/f36-components';
import { css } from '@emotion/css';
import { CloneReferenceEntry } from '../utils/EntryCloner';

type DialogInvocationParameters = {
  rootEntryId: string;
  referenceEntries: CloneReferenceEntry[];
};

const styles = {
  root: css({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
  }),
  header: css({
    padding: '24px 24px 16px',
    borderBottom: '1px solid #e5ebf1',
  }),
  content: css({
    flex: 1,
    padding: '20px 24px',
    overflowY: 'auto',
  }),
  controls: css({
    padding: '16px 24px 24px',
    borderTop: '1px solid #e5ebf1',
    backgroundColor: '#ffffff',
  }),
  entryRow: css({
    width: '100%',
  }),
};

function ReferenceSelectionDialog() {
  const sdk = useSDK<DialogAppSDK>();
  const invocationParameters = sdk.parameters.invocation as DialogInvocationParameters;
  const { rootEntryId, referenceEntries } = invocationParameters;
  useAutoResizer();

  const allEntryIds = useMemo(
    () => referenceEntries.map((entry) => entry.entryId),
    [referenceEntries]
  );
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set(allEntryIds));

  const selectedReferenceCount = selectedEntryIds.size - 1;
  const totalReferenceCount = allEntryIds.length - 1;
  const allReferencesSelected = selectedReferenceCount === totalReferenceCount;

  const handleToggleEntry = (entryId: string, checked: boolean) => {
    if (entryId === rootEntryId) {
      return;
    }

    setSelectedEntryIds((currentSelectedEntryIds) => {
      const nextSelectedEntryIds = new Set(currentSelectedEntryIds);
      if (checked) {
        nextSelectedEntryIds.add(entryId);
      } else {
        nextSelectedEntryIds.delete(entryId);
      }
      nextSelectedEntryIds.add(rootEntryId);
      return nextSelectedEntryIds;
    });
  };

  const handleToggleAllReferences = () => {
    setSelectedEntryIds(allReferencesSelected ? new Set([rootEntryId]) : new Set(allEntryIds));
  };

  const handleCancel = () => {
    sdk.close(null);
  };

  const handleConfirm = () => {
    sdk.close(Array.from(selectedEntryIds));
  };

  return (
    <Box className={styles.root}>
      <Box className={styles.header}>
        <Heading marginBottom="spacingXs">Select entries to clone</Heading>
        <Paragraph marginBottom="none">
          Review referenced entries and deselect any you want to keep linked to the originals
          instead of cloning.
        </Paragraph>
      </Box>

      <Box className={styles.content}>
        <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingM">
          <Text fontColor="gray700" fontWeight="fontWeightMedium">
            {`Selected ${selectedReferenceCount} of ${totalReferenceCount} referenced ${
              totalReferenceCount === 1 ? 'entry' : 'entries'
            }`}
          </Text>
          <Button variant="secondary" size="small" onClick={handleToggleAllReferences}>
            {allReferencesSelected ? 'Deselect all references' : 'Select all references'}
          </Button>
        </Flex>

        <Stack spacing="spacingS" flexDirection="column" alignItems="stretch">
          {referenceEntries.map((entry) => {
            const isRoot = entry.entryId === rootEntryId;
            const isChecked = selectedEntryIds.has(entry.entryId);

            return (
              <Checkbox
                key={entry.entryId}
                className={styles.entryRow}
                isChecked={isChecked}
                isDisabled={isRoot}
                onChange={(event) => handleToggleEntry(entry.entryId, event.target.checked)}>
                <Text fontWeight={isRoot ? 'fontWeightDemiBold' : 'fontWeightMedium'}>
                  {entry.label}
                </Text>
                <Text as="div" fontColor="gray500" fontSize="fontSizeS">
                  {isRoot ? 'Root entry' : `${entry.contentTypeId} · ${entry.entryId}`}
                </Text>
              </Checkbox>
            );
          })}
        </Stack>
      </Box>

      <Flex justifyContent="flex-end" alignItems="center" className={styles.controls}>
        <Button variant="transparent" size="small" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="small" onClick={handleConfirm}>
          Clone selected entries
        </Button>
      </Flex>
    </Box>
  );
}

export default ReferenceSelectionDialog;
