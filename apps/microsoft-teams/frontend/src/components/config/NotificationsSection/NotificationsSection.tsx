import { Dispatch, useState } from 'react';
import { Box, ModalLauncher, Subheading } from '@contentful/f36-components';
import { styles } from './NotificationsSection.styles';
import { notificationsSection } from '@constants/configCopy';
import AddButton from '@components/config/AddButton/AddButton';
import NotificationEditMode from '@components/config/NotificationEditMode/NotificationEditMode';
import NotificationViewMode from '@components/config/NotificationViewMode/NotificationViewMode';
import DeleteModal from '@components/config/DeleteModal/DeleteModal';
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
    notificationsPayload[index] = { ...notificationsPayload[index], ...editedNotification };
    dispatch({
      type: actions.UPDATE_NOTIFICATIONS,
      payload: notificationsPayload,
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
