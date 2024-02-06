import { appDeepLink, channelSelection } from '@constants/configCopy';
import { Button, Modal, Paragraph, TextLink } from '@contentful/f36-components';
import { TeamsChannel, Notification } from '@customTypes/configPage';

interface Props {
  children: React.ReactNode;
  onClose: () => void;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
  selectedChannel: TeamsChannel;
}

const ChannelSelectionSupplementalModalContent = (props: Props) => {
  const { children, onClose, handleNotificationEdit, selectedChannel } = props;
  const { button, link, description } = channelSelection.modal;

  return (
    <>
      <Modal.Content>
        <Paragraph>
          {description}{' '}
          <TextLink href={appDeepLink} target="_blank" rel="noopener noreferrer">
            {link}
          </TextLink>
        </Paragraph>
        {children}
      </Modal.Content>
      <Modal.Controls>
        <Button
          size="small"
          variant="primary"
          onClick={() => {
            handleNotificationEdit({ channel: selectedChannel });
            onClose();
          }}
          isDisabled={!selectedChannel.id}>
          {button}
        </Button>
      </Modal.Controls>
    </>
  );
};

export default ChannelSelectionSupplementalModalContent;
