import { Box, Flex, IconButton, ModalLauncher, Text, TextInput } from '@contentful/f36-components';
import AddButton from '@components/config/AddButton/AddButton';
import SelectionModal from '@components/config/ChannelSelectionModal/ChannelSelectionModal';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { channelSelection } from '@constants/configCopy';
import { Notification } from '@customTypes/configPage';
import { EditIcon } from '@contentful/f36-icons';
import { styles } from './ChannelSelection.styles';
// TODO: update this when we start fetching channel installations
import mockChannels from '@test/mocks/mockChannels.json';

interface Props {
  notification: Notification;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
}

const ChannelSelection = (props: Props) => {
  const { notification, handleNotificationEdit } = props;

  const openSelectionModal = () => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <SelectionModal
        isShown={isShown}
        onClose={() => {
          onClose(true);
        }}
        handleNotificationEdit={handleNotificationEdit}
        savedChannelId={notification.channelId}
      />
    ));
  };

  // TODO: update this when we start fetching channel installations
  const getChannelName = (channelId: string) => {
    const channel = mockChannels.find((channel) => channelId === channel.id);
    const displayName = channel ? `${channel.name}, ${channel.teamName}` : '';
    return displayName;
  };

  return (
    <Box marginBottom="spacingL">
      <Flex marginBottom="spacingS" alignItems="center" className={styles.logo}>
        <TeamsLogo />
        <Text marginLeft="spacingXs" marginBottom="none" fontWeight="fontWeightMedium">
          {channelSelection.title}
        </Text>
      </Flex>
      {notification.channelId ? (
        <TextInput.Group>
          <TextInput
            id="selected-channel"
            isDisabled={true}
            value={getChannelName(notification.channelId)}
            className={styles.input}
          />
          <IconButton
            variant="secondary"
            icon={<EditIcon />}
            onClick={openSelectionModal}
            aria-label="Change selected channel"
          />
        </TextInput.Group>
      ) : (
        <AddButton
          buttonCopy={channelSelection.addButton}
          // TODO: update this button to launch the channel selection modal
          handleClick={openSelectionModal}
        />
      )}
    </Box>
  );
};

export default ChannelSelection;
