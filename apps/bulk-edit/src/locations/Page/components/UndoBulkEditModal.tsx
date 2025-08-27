import React from 'react';
import { Modal, Button, Text, Flex } from '@contentful/f36-components';
import { truncate } from '../utils/entryUtils';

interface UndoBulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUndo: () => void;
  firstEntryFieldValue: string;
  isSaving: boolean;
  entryCount: number;
}

export const UndoBulkEditModal: React.FC<UndoBulkEditModalProps> = ({
  isOpen,
  onClose,
  onUndo,
  firstEntryFieldValue,
  isSaving,
  entryCount,
}) => {
  const title = entryCount === 1 ? 'Edit' : 'Bulk edit';

  return (
    <Modal
      isShown={isOpen}
      onClose={onClose}
      size="medium"
      aria-label={title}
      key={`undo-bulk-edit-modal-${isOpen ? 'open' : 'closed'}`}>
      <Modal.Header title={title} />
      <Modal.Content>
        <Flex gap="spacingS" flexDirection="column">
          <Text>
            {entryCount === 1 ? (
              <>
                The update for <b>{truncate(firstEntryFieldValue, 100)}</b> will be reverted.
              </>
            ) : (
              <>
                The update for <b>{truncate(firstEntryFieldValue, 100)}</b> and{' '}
                <b>{entryCount - 1}</b> more entry fields will be reverted.
              </>
            )}
          </Text>
        </Flex>
      </Modal.Content>
      <Modal.Controls>
        <Button
          variant="secondary"
          onClick={onClose}
          testId="undo-bulk-cancel"
          isDisabled={isSaving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onUndo} testId="undo-bulk-confirm" isLoading={isSaving}>
          Undo
        </Button>
      </Modal.Controls>
    </Modal>
  );
};
