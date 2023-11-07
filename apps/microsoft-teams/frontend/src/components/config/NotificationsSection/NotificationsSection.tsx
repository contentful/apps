import { Box, Subheading } from '@contentful/f36-components';
import { styles } from './NotificationsSection.styles';
import { notificationsSection } from '@constants/configCopy';
import AddButton from '@components/config/AddButton/AddButton';
import NotificationEditMode from '../NotificationEditMode/NotificationEditMode';
import { Notification } from '@customTypes/configPage';

interface Props {
  notifications: Notification[];
  createNewNotification: () => void;
}

const NotificationsSection = (props: Props) => {
  const { notifications, createNewNotification } = props;

  return (
    <Box className={styles.box}>
      <Subheading>{notificationsSection.title}</Subheading>
      <AddButton
        buttonCopy={notificationsSection.createButton}
        handleClick={createNewNotification}
      />
      {notifications.map((notification, index) => {
        return (
          <NotificationEditMode
            key={`${index}-${notification.channelId}-${notification.contentTypeId}`}
            index={index}
          />
        );
      })}
    </Box>
  );
};

export default NotificationsSection;
