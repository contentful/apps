import { useContext, useState, useEffect } from 'react';
import { Box, Flex, IconButton, ModalLauncher, Text, TextInput } from '@contentful/f36-components';
import AddButton from '@components/config/AddButton/AddButton';
import ChannelSelectionModal from '@components/config/ChannelSelectionModal/ChannelSelectionModal';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { channelSelection } from '@constants/configCopy';
import { Notification } from '@customTypes/configPage';
import { EditIcon } from '@contentful/f36-icons';
import { styles } from './ChannelSelection.styles';
import { ChannelContext } from '@context/ChannelProvider';
import { isItemValid } from '@helpers/configHelpers';
import ErrorMessage from '@components/config/ErrorMessage/ErrorMessage';

interface Props {
  notification: Notification;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
}

const ChannelSelection = (props: Props) => {
  const { notification, handleNotificationEdit } = props;
  const { channels, loading, error } = useContext(ChannelContext);
  const [areChannelsLoading, setAreChannelsLoading] = useState<boolean>(false);
  const [addButtonClicked, setAddButtonClicked] = useState<boolean>(false);
  const [isSavedChannelValid, setIsSavedChannelValid] = useState<boolean>(true);

  useEffect(() => {
    // ensure the loading state updates once it is done loading
    if (addButtonClicked) setAreChannelsLoading(loading);
  }, [loading, addButtonClicked]);

  useEffect(() => {
    if (notification.channel.id && loading === false && error === undefined) {
      const isValid = isItemValid(notification.channel.id, channels, 'channel');
      setIsSavedChannelValid(isValid);
    }
  }, [loading, error, notification.channel.id]);

  const openChannelSelectionModal = () => {
    if (loading != areChannelsLoading) {
      setAreChannelsLoading(loading);
      setAddButtonClicked(true);
      return;
    } else if (!areChannelsLoading)
      return ModalLauncher.open(({ isShown, onClose }) => (
        <ChannelSelectionModal
          isShown={isShown}
          onClose={() => onClose(true)}
          handleNotificationEdit={handleNotificationEdit}
          savedChannel={notification.channel}
          channels={channels}
          error={Boolean(error)}
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
        <Flex flexDirection="row" justifyContent="flex-start" alignItems="center">
          <Box>
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
                isLoading={areChannelsLoading}
              />
            </TextInput.Group>
          </Box>
          {!isSavedChannelValid && (
            <Box marginLeft="spacingXs">
              <ErrorMessage errorMessage={channelSelection.notFound} />
            </Box>
          )}
        </Flex>
      ) : (
        <AddButton
          buttonCopy={channelSelection.addButton}
          handleClick={openChannelSelectionModal}
          isLoading={areChannelsLoading}
        />
      )}
    </Box>
  );
};

export default ChannelSelection;
