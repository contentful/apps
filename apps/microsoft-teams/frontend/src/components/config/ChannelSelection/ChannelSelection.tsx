import { useContext } from 'react';
import { Box, Flex, IconButton, ModalLauncher, Text, TextInput } from '@contentful/f36-components';
import AddButton from '@components/config/AddButton/AddButton';
import ChannelSelectionModal from '@components/config/ChannelSelectionModal/ChannelSelectionModal';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { channelSelection } from '@constants/configCopy';
import { Notification } from '@customTypes/configPage';
import { EditIcon } from '@contentful/f36-icons';
import { styles } from './ChannelSelection.styles';
import { ChannelContext } from '@context/ChannelProvider';

interface Props {
  notification: Notification;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
}

const ChannelSelection = (props: Props) => {
  const { notification, handleNotificationEdit } = props;
  const { channels } = useContext(ChannelContext);

  const openChannelSelectionModal = () => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <ChannelSelectionModal
        isShown={isShown}
        onClose={() => onClose(true)}
        handleNotificationEdit={handleNotificationEdit}
        savedChannel={notification.channel}
        channels={channels}
      />
    ));
  };

  return (
    <Box marginBottom="spacingL">
      <Flex marginBottom="spacingS" alignItems="center" className={styles.logo}>
        <TeamsLogo />
        <Text marginLeft="spacingXs" marginBottom="none" fontWeight="fontWeightMedium">
          {channelSelection.title}
        </Text>
      </Flex>
      {notification.channel.id ? (
        <TextInput.Group>
          <TextInput
            id="selected-channel"
            isDisabled={true}
            value={`${notification.channel.name}, ${notification.channel.teamName}`}
            className={styles.input}
          />
          <IconButton
            variant="secondary"
            icon={<EditIcon />}
            onClick={openChannelSelectionModal}
            aria-label="Change selected channel"
          />
        </TextInput.Group>
      ) : (
        <AddButton
          buttonCopy={channelSelection.addButton}
          handleClick={openChannelSelectionModal}
        />
      )}
    </Box>
  );
};

export default ChannelSelection;
