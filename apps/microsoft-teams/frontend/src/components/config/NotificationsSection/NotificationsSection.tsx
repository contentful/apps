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
import { getUniqueNotifications, getDuplicateNotificationIndex } from '@helpers/configHelpers';

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

  const updateNotification = (
    index: number,
    editedNotification: Partial<Notification>,
    isNew?: boolean
  ) => {
    const notificationsPayload = [...notifications];
    const existingNotification = notificationsPayload[index];

    // Update the notification at the specified index
    const updatedNotification = { ...existingNotification, ...editedNotification };
    notificationsPayload[index] = updatedNotification;

    // Check if the updated notification is unique
    const uniqueNotifications = getUniqueNotifications(notificationsPayload);
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
              if (isNew) {
                // If the updated notification is new, delete it from state
                notificationsPayload.splice(index, 1);
                const duplicateNotificationIndex = getDuplicateNotificationIndex(
                  notificationsPayload,
                  updatedNotification
                );

                onClose(true);
                deleteNotification(index);
                setNotificationIndexToEdit(duplicateNotificationIndex);
              } else {
                const duplicateNotificationIndex = getDuplicateNotificationIndex(
                  notificationsPayload,
                  updatedNotification,
                  index
                );

                onClose(true);
                setNotificationIndexToEdit(duplicateNotificationIndex);
              }
            }}
          />
        );
      });
    } else {
      // If new notification is unique, update state
      setNotificationIndexToEdit(null);
      dispatch({
        type: actions.UPDATE_NOTIFICATIONS,
        payload: uniqueNotifications,
      });
    }
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
