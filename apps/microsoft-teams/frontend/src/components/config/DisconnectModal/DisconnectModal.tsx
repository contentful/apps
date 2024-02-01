import { ModalConfirm, Text } from '@contentful/f36-components';
import { accessSection } from '@constants/configCopy';

interface Props {
  isShown: boolean;
  handleCancel: () => void;
  handleDelete: () => void;
}

const DisconnectModal = (props: Props) => {
  const { isShown, handleCancel, handleDelete } = props;
  const { confirmDisonnect, goBack, description } = accessSection.disconnectModal;

  return (
    <ModalConfirm
      intent="negative"
      isShown={isShown}
      onCancel={handleCancel}
      onConfirm={handleDelete}
      cancelLabel={goBack}
      confirmLabel={confirmDisonnect}>
      <Text>{description}</Text>
    </ModalConfirm>
  );
};

export default DisconnectModal;
