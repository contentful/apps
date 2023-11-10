import { useEffect, useState } from 'react';
import { Box, Checkbox, Flex, FormControl, Text } from '@contentful/f36-components';
import AddButton from '@components/config/AddButton/AddButton';
import ChannelSelection from '../ChannelSelection/ChannelSelection';
import ContentfulLogo from '@components/config/ContentfulLogo/ContentfulLogo';
import NotificationEditModeFooter from '@components/config/NotificationEditModeFooter/NotificationEditModeFooter';
import { styles } from './NotificationEditMode.styles';
import { actionsSection, contentTypeSelection } from '@constants/configCopy';
import { Notification } from '@customTypes/configPage';

interface Props {
  index: number;
  deleteNotification: (index: number) => void;
  updateNotification: (index: number, editedNotification: Partial<Notification>) => void;
  notification: Notification;
}

const NotificationEditMode = (props: Props) => {
  const { index, deleteNotification, updateNotification, notification } = props;

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
        <Box marginBottom="spacingL">
          <Flex marginBottom="spacingS" alignItems="center">
            <ContentfulLogo />
            <Text marginLeft="spacingXs" marginBottom="none" fontWeight="fontWeightMedium">
              {contentTypeSelection.title}
            </Text>
          </Flex>
          <AddButton
            buttonCopy={contentTypeSelection.addButton}
            // TODO: update this button to launch the content type selection modal
            handleClick={() => console.log('click')}
          />
        </Box>
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
