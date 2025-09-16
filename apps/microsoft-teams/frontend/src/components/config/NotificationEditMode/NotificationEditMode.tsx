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
  canTestNotificationBeSent,
} from '@helpers/configHelpers';
import CancelModal from '@components/config/CancelModal/CancelModal';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { editModeFooter } from '@constants/configCopy';
import { isSendTestMessageResult } from '../../../types/appActionResults';

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
  const [isTestSending, setIsTestSending] = useState<boolean>(false);

  const sdk = useSDK<ConfigAppSDK>();

  useEffect(() => {
    setEditedNotification(notification);
  }, [notification]);

  const handleNotificationEdit = (notificationEdit: Partial<Notification>) => {
    setEditedNotification({ ...editedNotification, ...notificationEdit });
  };

  const handleTest = async (notification: Notification) => {
    try {
      setIsTestSending(true);
      const parameters = {
        channelId: notification.channel.id,
        teamId: notification.channel.teamId,
        contentTypeId: notification.contentTypeId,
      };

      const { result, error } = await sdk.cma.appActionCall.createWithResult(
        {
          appActionId: 'msteamsSendTestMessage',
          environmentId: sdk.ids.environment,
          spaceId: sdk.ids.space,
          appDefinitionId: sdk.ids.app!,
        },
        {
          parameters,
        }
      );

      if (result && isSendTestMessageResult(result) && result.ok) {
        sdk.notifier.success(editModeFooter.testSuccess);
      } else if (error) {
        throw new Error(`${editModeFooter.testError}: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        sdk.notifier.error(error.message || editModeFooter.testError);
      } else {
        sdk.notifier.error(editModeFooter.testError);
      }
      console.error(error);
    } finally {
      setIsTestSending(false);
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
        isTestSending={isTestSending}
        isTestDisabled={!canTestNotificationBeSent(editedNotification, notification)}
        isNew={isNotificationNew(notification)}
      />
    </Box>
  );
};

export default NotificationEditMode;
