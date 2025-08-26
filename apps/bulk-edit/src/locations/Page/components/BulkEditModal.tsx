import React, { useEffect, useState } from 'react';
import { Modal, Button, TextInput, Text, Flex, FormControl } from '@contentful/f36-components';
import type { Entry, ContentTypeField } from '../types';
import { getEntryFieldValue, truncate } from '../utils/entryUtils';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newValue: string | number) => void;
  selectedEntries: Entry[];
  selectedField: ContentTypeField | null;
  defaultLocale: string;
  isSaving: boolean;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedEntries,
  selectedField,
  defaultLocale,
  isSaving,
}) => {
  const [value, setValue] = useState('');
  const entryCount = selectedEntries.length;
  const firstEntry = selectedEntries[0];
  const firstValueToUpdate =
    firstEntry && selectedField && defaultLocale
      ? getEntryFieldValue(firstEntry, selectedField, defaultLocale)
      : '';
  const title = entryCount === 1 ? 'Edit' : 'Bulk edit';

  const isNumber = selectedField?.type === 'Number' || selectedField?.type === 'Integer';
  const isInvalid = selectedField?.type === 'Integer' && !Number.isInteger(Number(value));

  useEffect(() => {
    setValue('');
  }, [isOpen]);

  return (
    <Modal isShown={isOpen} onClose={onClose} size="medium" aria-label={title}>
      <Modal.Header title={title} />
      <Modal.Content>
        <Flex gap="spacingS" flexDirection="column">
          <Text>
            Editing field: <Text fontWeight="fontWeightDemiBold">{selectedField?.name}</Text>
          </Text>
          <Flex>
            <Text>
              <Text fontWeight="fontWeightDemiBold">{truncate(firstValueToUpdate, 100)}</Text>{' '}
              {entryCount === 1 ? 'selected' : `selected and ${entryCount - 1} more`}
            </Text>
          </Flex>
          <FormControl isInvalid={isInvalid}>
            <TextInput
              name="bulk-edit-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter your new value"
              type={isNumber ? 'number' : 'text'}
              isInvalid={isInvalid}
              autoFocus
            />
            {isInvalid && (
              <FormControl.ValidationMessage>
                Integer field does not allow decimal
              </FormControl.ValidationMessage>
            )}
          </FormControl>
        </Flex>
      </Modal.Content>
      <Modal.Controls>
        <Button
          variant="secondary"
          onClick={onClose}
          testId="bulk-edit-cancel"
          isDisabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (isInvalid) return;
            const finalValue = isNumber ? Number(value) : value;
            onSave(finalValue);
          }}
          isDisabled={!value || isInvalid}
          testId="bulk-edit-save"
          isLoading={isSaving}>
          Save
        </Button>
      </Modal.Controls>
    </Modal>
  );
};
