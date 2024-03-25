import { Box, IconButton, Flex, Menu, Subheading, Paragraph } from '@contentful/f36-components';
import { MoreHorizontalIcon } from '@contentful/f36-icons';
import { styles } from './NotificationViewMode.styles';
import { Notification } from '@customTypes/configPage';
import { notificationsSection } from '@constants/configCopy';

interface Props {
  notification: Notification;
  handleEdit: () => void;
  isMenuDisabled: boolean;
  handleDelete: () => void;
}

const NotificationViewMode = (props: Props) => {
  const { notification, handleEdit, isMenuDisabled, handleDelete } = props;

  return (
    <Box className={styles.wrapper}>
      <Flex justifyContent="space-between">
        <Flex flexDirection="column">
          <Subheading marginBottom="none">{notification.contentTypeName}</Subheading>
          <Paragraph marginBottom="none">
            {`${notification.channel.name}, ${notification.channel.teamName}`}
          </Paragraph>
        </Flex>
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
      </Flex>
    </Box>
  );
};

export default NotificationViewMode;
