import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Box, ModalLauncher } from '@contentful/f36-components';
import ContentTypeSelection from '@components/config/ContentTypeSelection/ContentTypeSelection';
import ChannelSelection from '@components/config/ChannelSelection/ChannelSelection';
import EventsSelection from '@components/config/EventsSelection/EventsSelection';
import NotificationEditModeFooter from '@components/config/NotificationEditModeFooter/NotificationEditModeFooter';
import DeleteModal from '@components/config/DeleteModal/DeleteModal';
import { styles } from './NotificationEditMode.styles';
import { Notification } from '@customTypes/configPage';
import { ContentTypeProps } from 'contentful-management';
import { isNotificationReadyToSave, isNotificationDefault } from '@helpers/configHelpers';

interface Props {
  index: number;
  deleteNotification: (index: number) => void;
  updateNotification: (index: number, editedNotification: Partial<Notification>) => void;
  notification: Notification;
  contentTypes: ContentTypeProps[];
  setNotificationIndexToEdit: Dispatch<SetStateAction<number | null>>;
  contentTypeConfigLink: string;
}

const NotificationEditMode = (props: Props) => {
  const {
    index,
    deleteNotification,
    updateNotification,
    notification,
    contentTypes,
    setNotificationIndexToEdit,
    contentTypeConfigLink,
  } = props;

  const [editedNotification, setEditedNotification] = useState<Notification>(notification);

  useEffect(() => {
    setEditedNotification(notification);
  }, [notification]);

  const handleNotificationEdit = (notificationEdit: Partial<Notification>) => {
    setEditedNotification({ ...editedNotification, ...notificationEdit });
  };

  const handleDelete = () => {
    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <DeleteModal
          isShown={isShown}
          handleCancel={() => {
            onClose(true);
          }}
          handleDelete={() => {
            onClose(true);
            deleteNotification(index);
            setNotificationIndexToEdit(null);
          }}
        />
      );
    });
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
          contentTypes={contentTypes}
          contentTypeConfigLink={contentTypeConfigLink}
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
        handleDelete={handleDelete}
        handleSave={handleSave}
        isSaveDisabled={!isNotificationReadyToSave(editedNotification, notification)}
      />
    </Box>
  );
};

export default NotificationEditMode;
