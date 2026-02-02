import { Button, Modal, Paragraph } from '@contentful/f36-components';
import { PreviewEntry } from './previewTree/tree-utils';
import { PreviewTree } from './previewTree/PreviewTree';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewEntries: PreviewEntry[];
  onCreateEntries: (contentTypeIds: string[]) => void;
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
  if (!previewEntries || previewEntries.length === 0) {
    return null;
  }

  const handleClose = () => {
    if (!isLoading && !isCreatingEntries) {
      onClose();
    }
  };

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
              {previewEntries.length === 1 ? 'entry is' : 'entries are'} being suggested:
            </Paragraph>

            <PreviewTree previewEntries={previewEntries} />
          </Modal.Content>
          <Modal.Controls>
            <Button
              onClick={handleClose}
              variant="secondary"
              isDisabled={isLoading || isCreatingEntries}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                onCreateEntries(previewEntries.map((preview) => preview.entry.contentTypeId))
              }
              variant="primary"
              isDisabled={isLoading || previewEntries.length === 0}>
              {isCreatingEntries
                ? 'Creating entries...'
                : previewEntries.length === 1
                ? 'Create entry'
                : 'Create entries'}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
