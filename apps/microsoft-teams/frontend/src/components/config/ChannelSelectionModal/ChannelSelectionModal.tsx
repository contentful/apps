import { useCallback, useEffect, useState } from 'react';
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
import ErrorMessage from '@components/config/ErrorMessage/ErrorMessage';
import { defaultNotification } from '@constants/defaultParams';
import DebouncedSearchInput from '@components/config/DebouncedSearchInput/DebouncedSearchInput';
import SearchableList from '@components/config/SearchableList/SearchableList';

interface ChannelSelectionModalProps {
  isShown: boolean;
  onClose: () => void;
  savedChannel: TeamsChannel;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
  channels: TeamsChannel[];
  error: boolean;
}

const ChannelSelectionModal = (props: ChannelSelectionModalProps) => {
  const { isShown, onClose, savedChannel, handleNotificationEdit, channels, error } = props;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<TeamsChannel>(
    savedChannel ?? defaultNotification.channel
  );
  const {
    title,
    link,
    emptyContent,
    emptyHeading,
    errorMessage,
    searchPlaceholder,
    description,
    button,
  } = channelSelection.modal;

  useEffect(() => {
    const foundChannel = channels.find((channel) => channel.id === savedChannel.id);
    setSelectedChannel(foundChannel ?? defaultNotification.channel);
  }, [savedChannel]);

  const handleSearchQueryUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const renderRow = useCallback(
    (channel: TeamsChannel) => {
      return (
        <Table.Row
          key={channel.id}
          onClick={() => setSelectedChannel(channel)}
          className={styles.tableRow}>
          <Table.Cell>
            <Radio
              id={channel.id}
              isChecked={selectedChannel.id === channel.id}
              helpText={channel.teamName}>
              {channel.name}
            </Radio>
          </Table.Cell>
        </Table.Row>
      );
    },
    [selectedChannel]
  );

  const renderMainModalContent = () => {
    if (error) {
      return (
        <Modal.Content>
          <ErrorMessage errorMessage={errorMessage} />
        </Modal.Content>
      );
    }

    if (channels.length) {
      return (
        <>
          <Modal.Content>
            <Paragraph>
              {description}{' '}
              <TextLink href={appDeepLink} target="_blank" rel="noopener noreferrer">
                {link}
              </TextLink>
            </Paragraph>

            <FormControl as="fieldset" marginBottom="none">
              <DebouncedSearchInput
                placeholder={searchPlaceholder}
                onChange={handleSearchQueryUpdate}
              />
              <Table className={styles.table}>
                <Table.Body>
                  <SearchableList
                    list={channels}
                    renderListItem={renderRow}
                    searchKeys={['name', 'teamName']}
                    searchQuery={searchQuery}
                  />
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
      );
    }

    return (
      <Modal.Content>
        <DebouncedSearchInput placeholder={searchPlaceholder} disabled={true} />
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
