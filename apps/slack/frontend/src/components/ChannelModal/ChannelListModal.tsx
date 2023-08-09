import { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  Flex,
  SkeletonContainer,
  Skeleton,
  Note,
} from '@contentful/f36-components';
import { styles } from './ChannelListModal.styles';
import { apiClient } from '../../requests';
import { ConnectedWorkspace, SlackChannel, SlackChannelSimplified, useWorkspaceStore } from '../../workspace.store';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useNotificationStore } from '../../notification.store';

interface Props {
  isShown: boolean;
  onClose: () => void;
  workspace: ConnectedWorkspace;
  sdk: ConfigAppSDK,
  cma: any,
  index: number;
  selectedChannel?: SlackChannel
}

export const ChannelListModal = ({ isShown, onClose, workspace, sdk, cma, index, selectedChannel }: Props) => {
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChannelId, setSelectedChannelId] = useState<string>()
  const [channels, setChannels] = useWorkspaceStore(
    (state) => [
      state.channels,
      state.setChannels,
    ]
  );

  const { setSelectedChannel } =
  useNotificationStore((state) => ({
    setSelectedChannel: state.setSelectedChannel,
    setSelectedContentType: state.setSelectedContentType,
    toggleEvent: state.toggleEvent,
    removeNotificationAtIndex: state.removeNotificationAtIndex,
  }));

  const handleChannelChange = () => {
    setSelectedChannel(selectedChannelId!, index)
    onClose();
  }

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const fetchedChannels = await apiClient.getChannels(sdk, workspace.id, cma);
        if (Array.isArray(fetchedChannels)) {
          const unselectedChannels = selectedChannel ? fetchedChannels.filter((channel) => channel.id !== selectedChannel.id) : fetchedChannels;
          setChannels(unselectedChannels);
        }
        setError(false)
      } catch (e) {
        setError(true);
        console.error(e);
      }
      setLoading(false)
    };
    fetchChannels();
  }, [cma, workspace, sdk])

  const renderChannels = () => {
    if (error) {
      return (
        <>
          <Note variant="warning" title="Channels not available">
            Channels can&apos;t be shown. Failed to load the Slack channels
          </Note>
        </>
      );
    }

    return (
      channels?.map((channel: SlackChannelSimplified) => 
      <Button key={channel.id} onClick={() => setSelectedChannelId(channel.id)} value={channel.id} className={channel.id === selectedChannelId ? styles.selectedButton : styles.button}>
        {channel.name}
      </Button>
    )
    )
  }


  const getModalContent = () => {
    if (loading) { 
      return (
        <SkeletonContainer className={styles.skeleton}>
          <Skeleton.Image height={35} width='100%' />
          <Skeleton.Image height={35} width='100%' offsetTop={45}  />
        </SkeletonContainer>
      )
    }
    return (
      <>
        <Modal.Content className={styles.modal} >
          <Flex className={styles.channelWrapper} fullWidth flexDirection='column' >
            {renderChannels()}
          </Flex>
        </Modal.Content>
        <Modal.Controls className={styles.footer}>
          <Button
            isDisabled={!selectedChannelId}
            variant="primary"
            onClick={handleChannelChange}
            testId="select-channel-button">
            Apply selected channel
          </Button>
        </Modal.Controls>
      </>
    );
  };

  return (
    <Modal onClose={onClose} isShown={isShown} allowHeightOverflow>
      {() => (
        <>
          <Modal.Header title='Select a channel' onClose={onClose} />
          {getModalContent()}
        </>
      )}
    </Modal>
  );
};
