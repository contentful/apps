import { useState } from 'react';
import { Button, FormControl, Modal, Paragraph, Radio, Table } from '@contentful/f36-components';
import { channelSection } from '@constants/configCopy';
import { styles } from './ChannelSelectionModal.styles';
import { Notification } from '@customTypes/configPage';
import ModalHeader from '@components/config/ModalHeader/ModalHeader';
// TODO: update this when we start fetching channel installations
import mockChannels from '@test/mocks/mockChannels.json';

interface Props {
  isShown: boolean;
  onClose: () => void;
  savedChannelId: string;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
}

const SelectionModal = (props: Props) => {
  const { isShown, onClose, savedChannelId, handleNotificationEdit } = props;

  const [selectedChannelId, setSelectedChannelId] = useState(savedChannelId ?? '');

  return (
    <Modal onClose={onClose} isShown={isShown} allowHeightOverflow size="large">
      {() => (
        <>
          {/* <Modal.Header title={channelSection.modal.title} onClose={onClose} /> */}
          <ModalHeader title={channelSection.modal.title} onClose={onClose} />
          <Modal.Content>
            <Paragraph>{channelSection.modal.description}</Paragraph>
            <FormControl as="fieldset" marginBottom="none">
              <Table className={styles.table}>
                <Table.Body>
                  {/* TODO: update this when we start fetching channel installations */}
                  {mockChannels.map((channel) => (
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
              {channelSection.modal.button}
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

export default SelectionModal;
