import { useEffect, useState } from 'react';
import { Box, Checkbox, FormControl } from '@contentful/f36-components';
import ContentTypeSelection from '../ContentTypeSelection/ContentTypeSelection';
import ChannelSelection from '../ChannelSelection/ChannelSelection';
import NotificationEditModeFooter from '@components/config/NotificationEditModeFooter/NotificationEditModeFooter';
import { styles } from './NotificationEditMode.styles';
import { actionsSection } from '@constants/configCopy';
import { Notification } from '@customTypes/configPage';
import { ContentTypeProps } from 'contentful-management';

interface Props {
  index: number;
  deleteNotification: (index: number) => void;
  updateNotification: (index: number, editedNotification: Partial<Notification>) => void;
  notification: Notification;
  contentTypes: ContentTypeProps[];
}

const NotificationEditMode = (props: Props) => {
  const { index, deleteNotification, updateNotification, notification, contentTypes } = props;

  const [editedNotification, setEditedNotification] = useState<Notification>(notification);

  useEffect(() => {
    setEditedNotification(notification);
  }, [notification]);

  const handleNotificationEdit = (notificationEdit: Partial<Notification>) => {
    setEditedNotification({ ...editedNotification, ...notificationEdit });
  };

  const handleDelete = () => {
    deleteNotification(index);
  };

  const handleSave = () => {
    updateNotification(index, editedNotification);
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
        <Box>
          <FormControl as="fieldset">
            <FormControl.Label>{actionsSection.title}</FormControl.Label>
            <Checkbox.Group name="checkbox-options">
              {Object.values(actionsSection.options).map((event) => (
                <Checkbox
                  key={event.id}
                  id={`event-${event.id}-${index}`}
                  value={`event-${event.id}-${index}`}>
                  {event.text}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </FormControl>
        </Box>
      </Box>
      <NotificationEditModeFooter handleDelete={handleDelete} handleSave={handleSave} />
    </Box>
  );
};

export default NotificationEditMode;
