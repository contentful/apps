import { useEffect, useState } from 'react';
import { FormControl, Modal, Radio, Table } from '@contentful/f36-components';
import { appDeepLink, channelSelection } from '@constants/configCopy';
import { styles } from './ChannelSelectionModal.styles';
import { Notification, TeamsChannel } from '@customTypes/configPage';
import ModalHeader from '@components/config/ModalHeader/ModalHeader';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import EmptyState from '@components/config/EmptyState/EmptyState';
import EmptyFishbowl from '@components/config/EmptyState/EmptyFishbowl';
import ChannelsErrorMessage from '@components/config/ChannelsErrorMessage/ChannelsErrorMessage';
import { defaultNotification } from '@constants/defaultParams';
import ChannelsLoadingState from '../ChannelsLoadingState/ChannelsLoadingState';
import ChannelSelectionSupplementalModalContent from '../ChannelSelectionSupplementalModalContent/ChannelSelectionSupplementalModalContent';

interface ChannelSelectionModalProps {
  isShown: boolean;
  onClose: () => void;
  savedChannel: TeamsChannel;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
  channels: TeamsChannel[];
  loading: boolean;
  error: boolean;
}

const ChannelSelectionModal = (props: ChannelSelectionModalProps) => {
  const {
    isShown,
    onClose,
    savedChannel,
    handleNotificationEdit,
    channels,
    loading,
    error = true,
  } = props;
  const [selectedChannel, setSelectedChannel] = useState<TeamsChannel>(
    savedChannel ?? defaultNotification.channel
  );
  const { title, link, emptyContent, emptyHeading } = channelSelection.modal;

  useEffect(() => {
    const foundChannel = channels.find((channel) => channel.id === savedChannel.id);
    setSelectedChannel(foundChannel ?? defaultNotification.channel);
  }, [savedChannel]);

  const SupplementalModalContent = ({ children }: { children: React.ReactNode }) => (
    <ChannelSelectionSupplementalModalContent
      onClose={onClose}
      handleNotificationEdit={handleNotificationEdit}
      selectedChannel={selectedChannel}>
      {children}
    </ChannelSelectionSupplementalModalContent>
  );

  const renderMainModalContent = () => {
    if (loading)
      return (
        <SupplementalModalContent>
          <ChannelsLoadingState />
        </SupplementalModalContent>
      );

    if (error) {
      return (
        <Modal.Content>
          <ChannelsErrorMessage />
        </Modal.Content>
      );
    }

    if (channels.length) {
      return (
        <SupplementalModalContent>
          <FormControl as="fieldset" marginBottom="none">
            <Table className={styles.table}>
              <Table.Body>
                {channels.map((channel) => (
                  <Table.Row key={channel.id}>
                    <Table.Cell>
                      <Radio
                        id={channel.id}
                        isChecked={selectedChannel.id === channel.id}
                        onChange={() => setSelectedChannel(channel)}
                        helpText={channel.teamName}>
                        {channel.name}
                      </Radio>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </FormControl>
        </SupplementalModalContent>
      );
    }

    return (
      <Modal.Content>
        <EmptyState
          image={<EmptyFishbowl />}
          heading={emptyHeading}
          body={emptyContent}
          linkSubstring={link}
          linkHref={appDeepLink}
        />
      </Modal.Content>
    );
  };

  return (
    <Modal onClose={onClose} isShown={isShown} size="large">
      {() => (
        <>
          <ModalHeader title={title} onClose={onClose} icon={<TeamsLogo />} />
          {renderMainModalContent()}
        </>
      )}
    </Modal>
  );
};

export default ChannelSelectionModal;
