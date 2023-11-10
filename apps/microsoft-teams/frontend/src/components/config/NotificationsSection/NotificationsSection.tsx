import { Dispatch } from 'react';
import { Box, Subheading } from '@contentful/f36-components';
import { styles } from './NotificationsSection.styles';
import { notificationsSection } from '@constants/configCopy';
import AddButton from '@components/config/AddButton/AddButton';
import NotificationEditMode from '@components/config/NotificationEditMode/NotificationEditMode';
import { Notification } from '@customTypes/configPage';
import { ParameterAction, actions } from '@components/config/parameterReducer';

interface Props {
  notifications: Notification[];
  dispatch: Dispatch<ParameterAction>;
}

const NotificationsSection = (props: Props) => {
  const { notifications, dispatch } = props;

  const createNewNotification = () => {
    dispatch({ type: actions.ADD_NOTIFICATION });
  };

  const deleteNotification = (index: number) => {
    const notificationsPayload = [...notifications];
    notificationsPayload.splice(index, 1);
    dispatch({ type: actions.UPDATE_NOTIFICATIONS, payload: notificationsPayload });
  };

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
            key={`notification-${index}`}
            index={index}
            handleDelete={deleteNotification}
          />
        );
      })}
    </Box>
  );
};

export default NotificationsSection;
