import { ModalConfirm, Text } from '@contentful/f36-components';
import { editModeFooter } from '@constants/configCopy';

interface Props {
  isShown: boolean;
  handleCancel: () => void;
  handleDelete: () => void;
}

const DeleteModal = (props: Props) => {
  const { isShown, handleCancel, handleDelete } = props;

  return (
    <ModalConfirm
      intent="negative"
      isShown={isShown}
      onCancel={handleCancel}
      onConfirm={handleDelete}
      confirmLabel={editModeFooter.delete}>
      <Text>{editModeFooter.confirmDelete}</Text>
    </ModalConfirm>
  );
};

export default DeleteModal;
