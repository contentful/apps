import { useState } from 'react';
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

interface ChannelSelectionModalProps {
  isShown: boolean;
  onClose: () => void;
  savedChannelId: string;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
  channels: TeamsChannel[];
}

const ChannelSelectionModal = (props: ChannelSelectionModalProps) => {
  const { isShown, onClose, savedChannelId, handleNotificationEdit, channels } = props;
  const [selectedChannelId, setSelectedChannelId] = useState<string>(savedChannelId ?? '');
  const { title, button, link, emptyContent, emptyHeading, description } = channelSelection.modal;

  return (
    <Modal onClose={onClose} isShown={isShown} size="large">
      {() => (
        <>
          <ModalHeader title={title} onClose={onClose} icon={<TeamsLogo />} />
          <Modal.Content>
            {channels.length ? (
              <>
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
                        <Table.Row key={channel.id}>
                          <Table.Cell>
                            <Radio
                              id={channel.id}
                              isChecked={selectedChannelId === channel.id}
                              onChange={() => setSelectedChannelId(channel.id)}
                              helpText={channel.teamName}>
                              {channel.name}
                            </Radio>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </FormControl>
              </>
            ) : (
              <EmptyState
                image={<EmptyFishbowl />}
                heading={emptyHeading}
                body={emptyContent}
                linkSubstring={link}
                linkHref={appDeepLink}
              />
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button
              size="small"
              variant="primary"
              onClick={() => {
                handleNotificationEdit({ channelId: selectedChannelId });
                onClose();
              }}
              isDisabled={!selectedChannelId}>
              {button}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

export default ChannelSelectionModal;
