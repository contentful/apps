import { useState, useEffect } from 'react';
import { Button, Modal, Paragraph } from '@contentful/f36-components';
import { PreviewEntryList } from './PreviewEntryList';
import { PreviewEntry } from './types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewEntries: PreviewEntry[];
  onCreateEntries: (selectedEntries: PreviewEntry[]) => void;
  isCreatingEntries: boolean;
  isLoading: boolean;
}

export const PreviewModal = ({
  isOpen,
  onClose,
  previewEntries,
  onCreateEntries,
  isCreatingEntries,
  isLoading,
}: PreviewModalProps) => {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Select all entries by default
  useEffect(() => {
    if (previewEntries.length > 0) {
      setSelectedIndices(new Set(previewEntries.map((_, index) => index)));
    }
  }, [previewEntries]);

  if (!previewEntries || previewEntries.length === 0) {
    return null;
  }

  const handleClose = () => {
    if (!isLoading && !isCreatingEntries) {
      onClose();
    }
  };

  const handleToggleEntry = (index: number) => {
    setSelectedIndices((prev) => {
      const selected = new Set(prev);
      if (selected.has(index)) {
        selected.delete(index);
      } else {
        selected.add(index);
      }
      return selected;
    });
  };

  const handleToggleAll = () => {
    // Deselect all
    if (selectedIndices.size === previewEntries.length) setSelectedIndices(new Set());
    // Select all
    else setSelectedIndices(new Set(previewEntries.map((_, index) => index)));
  };

  const handleCreateEntries = () => {
    const selectedEntries = Array.from(selectedIndices).map((index) => previewEntries[index]);
    onCreateEntries(selectedEntries);
  };

  const selectedCount = selectedIndices.size;

  return (
    <Modal
      isShown={isOpen}
      onClose={handleClose}
      size="large"
      shouldCloseOnOverlayClick={!isLoading && !isCreatingEntries}
      shouldCloseOnEscapePress={!isLoading && !isCreatingEntries}>
      {() => (
        <>
          <Modal.Header title="Preview entries" onClose={handleClose} />
          <Modal.Content>
            <Paragraph marginBottom="spacingM" color="gray700">
              Based off the document, {previewEntries.length}{' '}
              {previewEntries.length === 1 ? 'entry is' : 'entries are'} being suggested. Select
              which entries you would like to create.
            </Paragraph>

            <PreviewEntryList
              previewEntries={previewEntries}
              selectedIndices={selectedIndices}
              onToggleEntry={handleToggleEntry}
              onToggleAll={handleToggleAll}
            />
          </Modal.Content>
          <Modal.Controls>
            <Button
              onClick={handleClose}
              variant="secondary"
              isDisabled={isLoading || isCreatingEntries}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateEntries}
              variant="primary"
              isDisabled={isLoading || selectedCount === 0}>
              {isCreatingEntries
                ? 'Creating entries...'
                : selectedCount === 1
                ? 'Create entry'
                : `Create ${selectedCount} entries`}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
