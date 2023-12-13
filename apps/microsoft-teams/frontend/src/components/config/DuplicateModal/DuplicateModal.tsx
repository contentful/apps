import { ModalConfirm, Text } from '@contentful/f36-components';
import { notificationsSection } from '@constants/configCopy';

interface DuplicateModalProps {
  isShown: boolean;
  handleCancel: () => void;
  handleConfirm: () => void;
}

const DuplicateModal = (props: DuplicateModalProps) => {
  const { isShown, handleCancel, handleConfirm } = props;

  return (
    <ModalConfirm
      intent="primary"
      modalHeaderProps={{ title: 'Duplicate Notification' }}
      isShown={isShown}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      confirmLabel={notificationsSection.duplicateModal.confirmDuplicate}
      cancelLabel={notificationsSection.duplicateModal.goBack}>
      <Text>{notificationsSection.duplicateModal.confirmDuplicateDescription}</Text>
    </ModalConfirm>
  );
};

export default DuplicateModal;
