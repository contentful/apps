import React, { useState } from 'react';
import { Modal, Button, TextInput, Text, Flex } from '@contentful/f36-components';
import type { Entry, ContentTypeField } from '../types';
import { ContentTypeProps } from 'contentful-management';
import { getEntryTitle, getEntryFieldValue } from '../utils/entryUtils';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newValue: string) => void;
  selectedEntries: Entry[];
  selectedField: ContentTypeField | null;
  fields: ContentTypeField[];
  defaultLocale: string;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedEntries,
  selectedField,
  fields,
  defaultLocale,
}) => {
  const [value, setValue] = useState('');
  const entryCount = selectedEntries.length;
  const firstEntry = selectedEntries[0];
  const firstValueToUpdate =
    firstEntry && selectedField && defaultLocale
      ? getEntryFieldValue(firstEntry, selectedField, defaultLocale)
      : '';
  const title = entryCount === 1 ? 'Edit' : 'Bulk edit';

  return (
    <Modal isShown={isOpen} onClose={onClose} size="medium" aria-label={title}>
      <Modal.Header title={title} />
      <Modal.Content>
        <Flex gap="spacingS" flexDirection="column">
          <Text>{selectedField ? `Editing field: ${selectedField.name}` : ''}</Text>
          <Flex>
            <Text>
              <Text fontWeight="fontWeightDemiBold">{firstValueToUpdate}</Text>{' '}
              {entryCount === 1 ? 'selected' : `selected and ${entryCount - 1} more`}
            </Text>
          </Flex>
          <TextInput
            name="bulk-edit-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter your new value"
            autoFocus
          />
        </Flex>
      </Modal.Content>
      <Modal.Controls>
        <Button variant="secondary" onClick={onClose} testId="bulk-edit-cancel">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(value)}
          isDisabled={!value}
          testId="bulk-edit-save">
          Save
        </Button>
      </Modal.Controls>
    </Modal>
  );
};
