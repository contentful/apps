import { Button, Modal, Paragraph } from '@contentful/f36-components';
interface RemoveContentModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
export const RemoveContentModal = ({ isOpen, onConfirm, onCancel }: RemoveContentModalProps) => {
  return (
    <Modal isShown={isOpen} onClose={onCancel} size="medium" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title="Remove content from entry" onClose={onCancel} />
          <Modal.Content>
            <Paragraph>
              Are you sure you&apos;d like to remove this content from the entry?
            </Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onCancel} size="small" variant="secondary">
              Cancel
            </Button>
            <Button onClick={onConfirm} size="small" variant="negative">
              Remove
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
