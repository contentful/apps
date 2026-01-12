import { Button, Modal, Paragraph } from '@contentful/f36-components';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, title, message }) => {
  return (
    <Modal isShown={isOpen} onClose={onClose} size="medium" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Paragraph>{message}</Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={onClose} variant="primary">
              Close
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
