import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Box } from '@contentful/f36-components';
import ContentTypeSelection from '@components/config/ContentTypeSelection/ContentTypeSelection';
import ChannelSelection from '@components/config/ChannelSelection/ChannelSelection';
import EventsSelection from '@components/config/EventsSelection/EventsSelection';
import NotificationEditModeFooter from '@components/config/NotificationEditModeFooter/NotificationEditModeFooter';
import { styles } from './NotificationEditMode.styles';
import { Notification } from '@customTypes/configPage';
import { ContentTypeProps } from 'contentful-management';

interface Props {
  index: number;
  deleteNotification: (index: number) => void;
  updateNotification: (index: number, editedNotification: Partial<Notification>) => void;
  notification: Notification;
  contentTypes: ContentTypeProps[];
  setNotificationIndexToEdit: Dispatch<SetStateAction<number | null>>;
}

const NotificationEditMode = (props: Props) => {
  const {
    index,
    deleteNotification,
    updateNotification,
    notification,
    contentTypes,
    setNotificationIndexToEdit,
  } = props;

  const [editedNotification, setEditedNotification] = useState<Notification>(notification);

  useEffect(() => {
    setEditedNotification(notification);
  }, [notification]);

  const handleNotificationEdit = (notificationEdit: Partial<Notification>) => {
    setEditedNotification({ ...editedNotification, ...notificationEdit });
  };

  const handleDelete = () => {
    deleteNotification(index);
    setNotificationIndexToEdit(null);
  };

  const handleSave = () => {
    updateNotification(index, editedNotification);
    setNotificationIndexToEdit(null);
  };

  return (
    <Box className={styles.wrapper}>
      <Box className={styles.main}>
        <ContentTypeSelection
          notification={editedNotification}
          handleNotificationEdit={handleNotificationEdit}
          contentTypes={contentTypes}
        />
        <ChannelSelection
          notification={editedNotification}
          handleNotificationEdit={handleNotificationEdit}
        />
        <EventsSelection
          notification={editedNotification}
          handleNotificationEdit={handleNotificationEdit}
        />
      </Box>
      <NotificationEditModeFooter handleDelete={handleDelete} handleSave={handleSave} />
    </Box>
  );
};

export default NotificationEditMode;
