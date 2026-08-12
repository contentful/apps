import { Button, Modal, Paragraph } from '@contentful/f36-components';

interface ConfirmCancelModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

export const ConfirmCancelModal = ({
  isOpen,
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmCancelModalProps) => {
  return (
    <Modal isShown={isOpen} onClose={onCancel} size="medium" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title="Delete this job?" onClose={onCancel} />
          <Modal.Content>
            <Paragraph>
              This will permanently delete the job. No entries will be created and you&apos;ll need
              to start over.
            </Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onCancel} variant="secondary" isDisabled={isConfirming}>
              Keep review open
            </Button>
            <Button
              onClick={onConfirm}
              variant="negative"
              isLoading={isConfirming}
              isDisabled={isConfirming}>
              Delete
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
