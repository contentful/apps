import { ModalConfirm, Text } from '@contentful/f36-components';
import { editModeFooter } from '@constants/configCopy';

interface Props {
  isShown: boolean;
  handleCancel: () => void;
  handleConfirm: () => void;
}

const CancelModal = (props: Props) => {
  const { isShown, handleCancel, handleConfirm } = props;

  return (
    <ModalConfirm
      intent="negative"
      isShown={isShown}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      confirmLabel={editModeFooter.confirmCancel}
      cancelLabel={editModeFooter.goBack}>
      <Text>{editModeFooter.confirmCancelDescription}</Text>
    </ModalConfirm>
  );
};

export default CancelModal;
