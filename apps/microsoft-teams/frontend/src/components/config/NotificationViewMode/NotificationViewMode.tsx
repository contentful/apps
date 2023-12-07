import { useContext } from 'react';
import { ContentTypeContext } from '@context/ContentTypeProvider';
import {
  Box,
  IconButton,
  Flex,
  Menu,
  Subheading,
  Paragraph,
  Switch,
} from '@contentful/f36-components';
import { MoreHorizontalIcon } from '@contentful/f36-icons';
import { styles } from './NotificationViewMode.styles';
import { getContentTypeName, getChannelName } from '@helpers/configHelpers';
import { Notification } from '@customTypes/configPage';
import {
  channelSelection,
  contentTypeSelection,
  notificationsSection,
} from '@constants/configCopy';
// TODO: update this when we start fetching channel installations
import mockChannels from '@test/mocks/mockChannels.json';

interface Props {
  index: number;
  updateNotification: (index: number, editedNotification: Partial<Notification>) => void;
  notification: Notification;
  handleEdit: () => void;
  isMenuDisabled: boolean;
  handleDelete: () => void;
}

const NotificationViewMode = (props: Props) => {
  const { index, notification, updateNotification, handleEdit, isMenuDisabled, handleDelete } =
    props;
  const { contentTypes } = useContext(ContentTypeContext);

  return (
    <Box className={styles.wrapper}>
      <Flex justifyContent="space-between">
        <Flex flexDirection="column">
          <Subheading marginBottom="none">
            {getContentTypeName(
              notification.contentTypeId,
              contentTypes,
              contentTypeSelection.notFound
            )}
          </Subheading>
          <Paragraph marginBottom="none">
            {getChannelName(notification.channelId, mockChannels, channelSelection.notFound)}
          </Paragraph>
        </Flex>
        <Flex alignItems="center">
          <Paragraph marginBottom="none" marginRight="spacingXs">
            {notificationsSection.enabledToggle}
          </Paragraph>
          <Switch
            name="enable-notification"
            id="enable-notification"
            isChecked={notification.isEnabled}
            onChange={() => updateNotification(index, { isEnabled: !notification.isEnabled })}
          />
          <Box marginLeft="spacingXs">
            <Menu>
              <Menu.Trigger>
                <IconButton
                  testId="menu-button"
                  variant="transparent"
                  icon={<MoreHorizontalIcon />}
                  aria-label="toggle menu"
                  isDisabled={isMenuDisabled}
                />
              </Menu.Trigger>
              <Menu.List>
                <Menu.Item onClick={handleEdit}>{notificationsSection.edit}</Menu.Item>
                <Menu.Item onClick={handleDelete}>{notificationsSection.delete}</Menu.Item>
              </Menu.List>
            </Menu>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default NotificationViewMode;
