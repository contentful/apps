import { ModalConfirm, Text, Box } from '@contentful/f36-components';
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
      modalHeaderProps={{
        title: notificationsSection.duplicateModal.modalHeaderTitle,
      }}
      isShown={isShown}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      confirmLabel={notificationsSection.duplicateModal.confirmDuplicate}
      cancelLabel={notificationsSection.duplicateModal.goBack}>
      <Box marginBottom="spacingM">
        <Text>{notificationsSection.duplicateModal.confirmDuplicateDescription}</Text>
      </Box>
      <Box>
        <Text>{notificationsSection.duplicateModal.confirmDuplicateDescriptionTwo}</Text>
      </Box>
    </ModalConfirm>
  );
};

export default DuplicateModal;
