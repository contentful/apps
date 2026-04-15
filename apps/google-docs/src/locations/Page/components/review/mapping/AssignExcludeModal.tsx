import { Button, Modal, Paragraph } from '@contentful/f36-components';

interface AssignExcludeModalProps {
  isOpen: boolean;
  title: string;
  preview: string;
  onClose: () => void;
}

export const AssignExcludeModal = ({
  isOpen,
  title,
  preview,
  onClose,
}: AssignExcludeModalProps): JSX.Element => {
  return (
    <Modal isShown={isOpen} onClose={onClose} size="medium" shouldCloseOnOverlayClick={false}>
      {() => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Paragraph>{preview}</Paragraph>
          </Modal.Content>
          <Modal.Controls>
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
