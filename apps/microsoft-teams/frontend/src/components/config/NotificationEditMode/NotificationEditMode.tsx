import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Box, ModalLauncher } from '@contentful/f36-components';
import ContentTypeSelection from '@components/config/ContentTypeSelection/ContentTypeSelection';
import ChannelSelection from '@components/config/ChannelSelection/ChannelSelection';
import EventsSelection from '@components/config/EventsSelection/EventsSelection';
import NotificationEditModeFooter from '@components/config/NotificationEditModeFooter/NotificationEditModeFooter';
import { styles } from './NotificationEditMode.styles';
import { Notification } from '@customTypes/configPage';
import {
  isNotificationReadyToSave,
  isNotificationNew,
  doesNotificationHaveChanges,
} from '@helpers/configHelpers';
import CancelModal from '@components/config/CancelModal/CancelModal';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

interface Props {
  index: number;
  deleteNotification: (index: number) => void;
  updateNotification: (
    index: number,
    editedNotification: Partial<Notification>,
    isNew?: boolean
  ) => void;
  notification: Notification;
  setNotificationIndexToEdit: Dispatch<SetStateAction<number | null>>;
}

const NotificationEditMode = (props: Props) => {
  const {
    index,
    deleteNotification,
    updateNotification,
    notification,
    setNotificationIndexToEdit,
  } = props;

  const [editedNotification, setEditedNotification] = useState<Notification>(notification);

  const sdk = useSDK<ConfigAppSDK>();

  useEffect(() => {
    setEditedNotification(notification);
  }, [notification]);

  const handleNotificationEdit = (notificationEdit: Partial<Notification>) => {
    setEditedNotification({ ...editedNotification, ...notificationEdit });
  };

  const handleTest = async (notification: Notification) => {
    try {
      const { name: spaceName } = await sdk.cma.space.get({ spaceId: sdk.ids.space });
      const parameters = {
        channelId: notification.channel.id,
        teamId: notification.channel.teamId,
        contentTypeId: notification.contentTypeId,
        spaceName,
      };

      const { response } = await sdk.cma.appActionCall.createWithResponse(
        {
          appActionId: 'msteamsSendTestNotification',
          environmentId: sdk.ids.environment,
          spaceId: sdk.ids.space,
          appDefinitionId: sdk.ids.app!,
        },
        {
          parameters,
        }
      );
      const body = JSON.parse(response.body);

      if (body.ok) {
        // TODO: display success toast
        console.log(`Test sent successfully, message id: ${body.data}`);
      } else {
        throw new Error(`Failed to send test message: ${body.errors?.[0]?.message}`);
      }
    } catch (error) {
      // TODO: display error to user if test notification fails
      console.error(error);
    }
  };

  const handleSave = () => {
    const isNew = isNotificationNew(notification);
    updateNotification(index, editedNotification, isNew);
  };

  const handleCancel = () => {
    const isNew = isNotificationNew(notification);
    const hasChanges = doesNotificationHaveChanges(editedNotification, notification);

    if (hasChanges) {
      ModalLauncher.open(({ isShown, onClose }) => {
        return (
          <CancelModal
            isShown={isShown}
            handleCancel={() => {
              onClose(true);
            }}
            handleConfirm={() => {
              if (isNew) deleteNotification(index);
              onClose(true);
              setEditedNotification(notification);
              setNotificationIndexToEdit(null);
            }}
          />
        );
      });
    } else {
      if (isNew) deleteNotification(index);
      setNotificationIndexToEdit(null);
    }
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
        handleTest={() => handleTest(editedNotification)}
        handleCancel={handleCancel}
        handleSave={handleSave}
        isSaveDisabled={!isNotificationReadyToSave(editedNotification, notification)}
      />
    </Box>
  );
};

export default NotificationEditMode;
