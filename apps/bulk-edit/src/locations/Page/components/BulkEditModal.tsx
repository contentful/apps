import React, { useEffect, useState } from 'react';
import { Button, Flex, FormControl, Modal, Note, Text } from '@contentful/f36-components';
import type { ContentTypeField, Entry } from '../types';
import { getEntryFieldValue, getFieldDisplayValue } from '../utils/entryUtils';
import { ClockIcon } from '@contentful/f36-icons';
import { FieldEditor } from './FieldEditor';
import type { LocalesAPI } from '@contentful/field-editor-shared';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newValue: string | number) => void;
  selectedEntries: Entry[];
  selectedField: ContentTypeField | null;
  locales: LocalesAPI;
  isSaving: boolean;
  totalUpdateCount: number;
  editionCount: number;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedEntries,
  selectedField,
  locales,
  isSaving,
  totalUpdateCount,
  editionCount,
}) => {
  const [value, setValue] = useState<any>('');
  const entryCount = selectedEntries.length;
  const firstEntry = selectedEntries[0];
  const firstValueToUpdate =
    firstEntry && selectedField && locales.default
      ? getEntryFieldValue(firstEntry, selectedField, locales.default)
      : '';
  const title = entryCount === 1 ? 'Edit' : 'Bulk edit';

  useEffect(() => {
    setValue('');
  }, [isOpen]);

  return (
    <Modal
      isShown={isOpen}
      onClose={onClose}
      size="medium"
      aria-label={title}
      key={`bulk-edit-modal-${isOpen ? 'open' : 'closed'}`}>
      <Modal.Header title={title} />
      <Modal.Content>
        <Flex gap="spacingS" flexDirection="column">
          <Text>
            Editing field: <Text fontWeight="fontWeightDemiBold">{selectedField?.name}</Text>
          </Text>
          <Flex>
            <Text>
              <Text fontWeight="fontWeightDemiBold">
                {getFieldDisplayValue(selectedField, firstValueToUpdate, 30)}
              </Text>{' '}
              {entryCount === 1 ? 'selected' : `selected and ${entryCount - 1} more`}
            </Text>
          </Flex>
          <FormControl>
            {selectedField && (
              <FieldEditor
                field={selectedField}
                value={value}
                onChange={setValue}
                locales={locales}
                datatest-id="field-editor"
              />
            )}
          </FormControl>
        </Flex>
        {totalUpdateCount > 0 && isSaving && (
          <Note title="Updating entries" variant="neutral" icon={<ClockIcon variant="muted" />}>
            {`${editionCount} of ${totalUpdateCount} completed`}
          </Note>
        )}
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
          onClick={() => onSave(value)}
          isDisabled={value === ''}
          testId="bulk-edit-save"
          isLoading={isSaving}>
          Save
        </Button>
      </Modal.Controls>
    </Modal>
  );
};
