import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Box } from '@contentful/f36-components';
import ContentTypeSelection from '@components/config/ContentTypeSelection/ContentTypeSelection';
import ChannelSelection from '@components/config/ChannelSelection/ChannelSelection';
import EventsSelection from '@components/config/EventsSelection/EventsSelection';
import NotificationEditModeFooter from '@components/config/NotificationEditModeFooter/NotificationEditModeFooter';
import { styles } from './NotificationEditMode.styles';
import { Notification } from '@customTypes/configPage';
import { isNotificationReadyToSave, isNotificationDefault } from '@helpers/configHelpers';

interface Props {
  index: number;
  updateNotification: (index: number, editedNotification: Partial<Notification>) => void;
  notification: Notification;
  setNotificationIndexToEdit: Dispatch<SetStateAction<number | null>>;
}

const NotificationEditMode = (props: Props) => {
  const { index, updateNotification, notification, setNotificationIndexToEdit } = props;

  const [editedNotification, setEditedNotification] = useState<Notification>(notification);

  useEffect(() => {
    setEditedNotification(notification);
  }, [notification]);

  const handleNotificationEdit = (notificationEdit: Partial<Notification>) => {
    setEditedNotification({ ...editedNotification, ...notificationEdit });
  };

  const handleSave = () => {
    updateNotification(index, editedNotification);
    setNotificationIndexToEdit(null);
  };

  const handleCancel = () => {
    setNotificationIndexToEdit(null);
  };

  return (
    <Box className={styles.wrapper}>
      <Box className={styles.main}>
        <ContentTypeSelection
          notification={editedNotification}
          handleNotificationEdit={handleNotificationEdit}
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
      <NotificationEditModeFooter
        handleCancel={handleCancel}
        isCancelDisabled={isNotificationDefault(editedNotification)}
        handleSave={handleSave}
        isSaveDisabled={!isNotificationReadyToSave(editedNotification, notification)}
      />
    </Box>
  );
};

export default NotificationEditMode;
