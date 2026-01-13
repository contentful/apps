import { Button, Modal, Paragraph } from '@contentful/f36-components';

interface ErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onTryAgain: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  onTryAgain,
}) => {
  return (
    <Modal
      isShown={isOpen}
      onClose={onClose}
      size="medium"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}>
      {() => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <Paragraph>{message}</Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button onClick={onTryAgain} variant="primary">
              Try again
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
