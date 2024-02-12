import { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  Modal,
  Paragraph,
  Radio,
  Table,
  TextLink,
} from '@contentful/f36-components';
import { appDeepLink, channelSelection } from '@constants/configCopy';
import { styles } from './ChannelSelectionModal.styles';
import { Notification, TeamsChannel } from '@customTypes/configPage';
import ModalHeader from '@components/config/ModalHeader/ModalHeader';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import EmptyState from '@components/config/EmptyState/EmptyState';
import EmptyFishbowl from '@components/config/EmptyState/EmptyFishbowl';
import { defaultNotification } from '@constants/defaultParams';

interface ChannelSelectionModalProps {
  isShown: boolean;
  onClose: () => void;
  savedChannel: TeamsChannel;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
  channels: TeamsChannel[];
}

const ChannelSelectionModal = (props: ChannelSelectionModalProps) => {
  const { isShown, onClose, savedChannel, handleNotificationEdit, channels } = props;
  const [selectedChannel, setSelectedChannel] = useState<TeamsChannel>(
    savedChannel ?? defaultNotification.channel
  );
  const { title, button, link, emptyContent, emptyHeading, description } = channelSelection.modal;

  useEffect(() => {
    const foundChannel = channels.find((channel) => channel.id === savedChannel.id);
    setSelectedChannel(foundChannel ?? defaultNotification.channel);
  }, [savedChannel]);

  return (
    <Modal onClose={onClose} isShown={isShown} size="large">
      {() => (
        <>
          <ModalHeader title={title} onClose={onClose} icon={<TeamsLogo />} />
          {channels.length ? (
            <>
              <Modal.Content>
                <Paragraph>
                  {description}{' '}
                  <TextLink href={appDeepLink} target="_blank" rel="noopener noreferrer">
                    {link}
                  </TextLink>
                </Paragraph>
                <FormControl as="fieldset" marginBottom="none">
                  <Table className={styles.table}>
                    <Table.Body>
                      {channels.map((channel) => (
                        <Table.Row
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={styles.tableRow}>
                          <Table.Cell>
                            <Radio
                              id={channel.id}
                              isChecked={selectedChannel.id === channel.id}
                              onChange={() => {
                                /* clicking entire row checks this radio, i.e. do nothing here */
                              }}
                              helpText={channel.teamName}>
                              {channel.name}
                            </Radio>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </FormControl>
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
          ) : (
            <Modal.Content>
              <EmptyState
                image={<EmptyFishbowl />}
                heading={emptyHeading}
                body={emptyContent}
                linkSubstring={link}
                linkHref={appDeepLink}
              />
            </Modal.Content>
          )}
        </>
      )}
    </Modal>
  );
};

export default ChannelSelectionModal;
