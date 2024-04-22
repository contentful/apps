import { ModalConfirm, Text } from '@contentful/f36-components';
import { accessSection } from '@constants/configCopy';

interface Props {
  isShown: boolean;
  handleCancel: () => void;
  handleDisconnect: () => void;
}

const DisconnectModal = (props: Props) => {
  const { isShown, handleCancel, handleDisconnect } = props;
  const { confirmDisconnect, goBack, description } = accessSection.disconnectModal;

  return (
    <ModalConfirm
      intent="negative"
      isShown={isShown}
      onCancel={handleCancel}
      onConfirm={handleDisconnect}
      cancelLabel={goBack}
      confirmLabel={confirmDisconnect}>
      <Text>{description}</Text>
    </ModalConfirm>
  );
};

export default DisconnectModal;
