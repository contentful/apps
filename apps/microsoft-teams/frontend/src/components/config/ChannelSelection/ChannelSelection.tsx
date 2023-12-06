import { Box, Flex, IconButton, ModalLauncher, Text, TextInput } from '@contentful/f36-components';
import AddButton from '@components/config/AddButton/AddButton';
import ChannelSelectionModal from '@components/config/ChannelSelectionModal/ChannelSelectionModal';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { channelSelection } from '@constants/configCopy';
import { Notification, TeamsChannel } from '@customTypes/configPage';
import { EditIcon } from '@contentful/f36-icons';
import { styles } from './ChannelSelection.styles';
import { getChannelName } from '@helpers/configHelpers';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useState } from 'react';

interface Props {
  notification: Notification;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
  sdk: ConfigAppSDK;
}

const ChannelSelection = (props: Props) => {
  const { notification, handleNotificationEdit } = props;
  const [channels, setChannels] = useState<TeamsChannel[]>([]);

  const openChannelSelectionModal = () => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <ChannelSelectionModal
        isShown={isShown}
        onClose={() => {
          onClose(true);
        }}
        handleNotificationEdit={handleNotificationEdit}
        savedChannelId={notification.channelId}
        sdk={props.sdk}
        channels={channels}
        setChannels={setChannels}
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
      {notification.channelId ? (
        <TextInput.Group>
          <TextInput
            id="selected-channel"
            isDisabled={true}
            value={getChannelName(notification.channelId, channels, channelSelection.notFound)}
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
