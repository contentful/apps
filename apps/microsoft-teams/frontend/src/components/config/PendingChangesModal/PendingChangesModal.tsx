import { Modal, ModalHeader, Text, Button } from '@contentful/f36-components';
import { notificationsSection } from '@constants/configCopy';

interface Props {
  isShown: boolean;
  onClose: () => void;
}

const PendingChangesModal = (props: Props) => {
  const { isShown, onClose } = props;
  const { areYouSure, description, ok } = notificationsSection.pendingChangesModal;

  return (
    <Modal isShown={isShown} onClose={onClose} size="medium">
      {() => (
        <>
          <ModalHeader title={areYouSure} onClose={onClose} />
          <Modal.Content>
            <Text>{description}</Text>
          </Modal.Content>
          <Modal.Controls>
            <Button
              size="small"
              variant="primary"
              onClick={() => {
                onClose();
              }}>
              {ok}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

export default PendingChangesModal;
