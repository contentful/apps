import { Button, Modal, Paragraph } from '@contentful/f36-components';

interface ErrorEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
}

export const ErrorEntriesModal: React.FC<ErrorEntriesModalProps> = ({
  isOpen,
  onClose,
  onTryAgain,
}) => {
  return (
    <Modal isShown={isOpen} onClose={onClose} size="medium" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title="Unable to create entries" onClose={onClose} />
          <Modal.Content>
            <Paragraph>No entries were created, please try again.</Paragraph>
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
