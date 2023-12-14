import { Dispatch, useState } from 'react';
import { Box, ModalLauncher, Subheading } from '@contentful/f36-components';
import { styles } from './NotificationsSection.styles';
import { notificationsSection } from '@constants/configCopy';
import AddButton from '@components/config/AddButton/AddButton';
import NotificationEditMode from '@components/config/NotificationEditMode/NotificationEditMode';
import NotificationViewMode from '@components/config/NotificationViewMode/NotificationViewMode';
import DeleteModal from '@components/config/DeleteModal/DeleteModal';
import DuplicateModal from '../DuplicateModal/DuplicateModal';
import { Notification } from '@customTypes/configPage';
import { ParameterAction, actions } from '@components/config/parameterReducer';
import useGetTeamsChannels from '@hooks/useGetTeamsChannels';
import { ContentTypeContextProvider } from '@context/ContentTypeProvider';

interface Props {
  notifications: Notification[];
  dispatch: Dispatch<ParameterAction>;
}

const NotificationsSection = (props: Props) => {
  const { notifications, dispatch } = props;
  const [notificationIndexToEdit, setNotificationIndexToEdit] = useState<number | null>(null);
  const channels = useGetTeamsChannels();

  const createNewNotification = () => {
    dispatch({ type: actions.ADD_NOTIFICATION });
    setNotificationIndexToEdit(0);
  };

  const deleteNotification = (index: number) => {
    const notificationsPayload = [...notifications];
    notificationsPayload.splice(index, 1);
    dispatch({
      type: actions.UPDATE_NOTIFICATIONS,
      payload: notificationsPayload,
    });
  };

  const handleDelete = (index: number) => {
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

  const updateNotification = (index: number, editedNotification: Partial<Notification>) => {
    const notificationsPayload = [...notifications];
    const existingNotification = notificationsPayload[index];

    // Update the notification at the specified index
    const updatedNotification = { ...existingNotification, ...editedNotification };
    notificationsPayload[index] = updatedNotification;

    // Use a Set to keep track of unique keys
    const uniqueKeys = new Set<string>();

    // Deduplicate based on content
    const uniqueNotifications = notificationsPayload.filter((notification) => {
      const key = `${notification.channelId}-${notification.contentTypeId}`;
      if (!uniqueKeys.has(key)) {
        uniqueKeys.add(key);
        return true;
      }
      return false;
    });

    // Check if the updated notification is unique
    const isUnique = uniqueNotifications.length === notificationsPayload.length;

    // If not unique, open the modal and set the index for further handling
    if (!isUnique) {
      ModalLauncher.open(({ isShown, onClose }) => {
        return (
          <DuplicateModal
            isShown={isShown}
            handleCancel={() => {
              onClose(true);
            }}
            handleConfirm={() => {
              setNotificationIndexToEdit(index);
              onClose(true);
            }}
          />
        );
      });
    }

    dispatch({
      type: actions.UPDATE_NOTIFICATIONS,
      payload: uniqueNotifications,
    });
  };

  return (
    <Box className={styles.box}>
      <Subheading>{notificationsSection.title}</Subheading>
      <Box marginBottom="spacingXl">
        <AddButton
          buttonCopy={notificationsSection.createButton}
          handleClick={createNewNotification}
          isDisabled={notificationIndexToEdit !== null}
        />
      </Box>
      <ContentTypeContextProvider>
        {notifications.map((notification, index) => {
          const inEditMode = notificationIndexToEdit === index;

          if (inEditMode) {
            return (
              <NotificationEditMode
                key={`notification-${index}`}
                index={index}
                deleteNotification={deleteNotification}
                updateNotification={updateNotification}
                notification={notification}
                setNotificationIndexToEdit={setNotificationIndexToEdit}
                channels={channels}
              />
            );
          } else {
            return (
              <NotificationViewMode
                key={`notification-${index}`}
                index={index}
                updateNotification={updateNotification}
                notification={notification}
                handleEdit={() => setNotificationIndexToEdit(index)}
                isMenuDisabled={notificationIndexToEdit !== null}
                handleDelete={() => handleDelete(index)}
                channels={channels}
              />
            );
          }
        })}
      </ContentTypeContextProvider>
    </Box>
  );
};

export default NotificationsSection;
