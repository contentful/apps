import { Button, Modal, Paragraph } from '@contentful/f36-components';

interface ConfirmCancelModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmCancelModal = ({ isOpen, onConfirm, onCancel }: ConfirmCancelModalProps) => {
  return (
    <Modal isShown={isOpen} onClose={onCancel} size="medium" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title="You're about to lose your progress" onClose={onCancel} />
          <Modal.Content>
            <Paragraph>No entries will be created and you'll need to start over.</Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onCancel} variant="secondary">
              Keep creating
            </Button>
            <Button onClick={onConfirm} variant="primary">
              Cancel without creating
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
