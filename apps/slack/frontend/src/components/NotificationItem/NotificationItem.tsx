import { useMemo, useEffect, useState } from 'react';
import {
  Checkbox,
  IconButton,
  TextInput,
  Text,
  ModalLauncher,
  Button,
  Flex,
  Spinner,
  Tooltip
} from '@contentful/f36-components';
import { DeleteIcon } from '@contentful/f36-icons';
import { Select, FormControl } from '@contentful/f36-components';
import { WarningIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { SlackNotification, useNotificationStore } from '../../notification.store';
import { apiClient } from '../../requests';
import { ChannelListModal } from '../ChannelModal/ChannelListModal';
import { ConnectedWorkspace, SlackChannel } from '../../workspace.store';
import { styles } from './NotificationItem.styles'

interface NotificationItemProps {
  notification: SlackNotification;
  index: number;
  contentTypes: ContentTypeProps[];
  workspace: ConnectedWorkspace;
}

enum SlackAppEventKey {
  PUBLISH = 'publish',
  UNPUBLISHED = 'unpublish',
  CREATED = 'create',
  DELETED = 'delete',
}

const SLACK_APP_EVENTS = {
  [SlackAppEventKey.PUBLISH]: {
    id: SlackAppEventKey.PUBLISH,
    text: 'published',
  },
  [SlackAppEventKey.UNPUBLISHED]: {
    id: SlackAppEventKey.UNPUBLISHED,
    text: 'unpublished',
  },
  [SlackAppEventKey.CREATED]: {
    id: SlackAppEventKey.CREATED,
    text: 'created',
  },
  [SlackAppEventKey.DELETED]: {
    id: SlackAppEventKey.DELETED,
    text: 'deleted',
  },
};

export const NotificationItem = ({
  contentTypes,
  notification,
  index,
  workspace
}: NotificationItemProps) => {
  const sdk = useSDK<ConfigAppSDK>();
  const cma = sdk.cma;
  const { setSelectedContentType, toggleEvent, removeNotificationAtIndex } =
    useNotificationStore((state) => ({
      setSelectedContentType: state.setSelectedContentType,
      toggleEvent: state.toggleEvent,
      removeNotificationAtIndex: state.removeNotificationAtIndex,
    }));
  
  const [channel, setChannel] = useState<SlackChannel>();
  const [channelLoading, setChannelLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const selectedEvents = useMemo(
    () =>
      Object.values(SLACK_APP_EVENTS).reduce((acc: string[], event) => {
        if (!notification.selectedEvent[event.id]) {
          return acc;
        }
        return [...acc, `event-${event.id}-${index}`];
      }, []),
    [notification.selectedEvent, index]
  );

  const getContentTypeName = (contentTypeId: string | null) => {
    if (!contentTypeId) return null;
    const foundContentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
    if (foundContentType) return foundContentType.name;
    return contentTypeId;
  };

  const openChannelListModal = () => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <ChannelListModal
        isShown={isShown}
        onClose={() => {
          onClose(true);
        }}
        workspace={workspace}
        sdk={sdk}
        cma={cma}
        index={index}
        selectedChannel={channel}
      />
    ));
  };

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        setChannelLoading(true)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const response = await apiClient.getChannel(sdk, workspace.id, cma, notification.selectedChannel!);
        setChannel(response)
        setError(false)
      } catch (e) {
        setError(true);
        console.error(e);
      }
      setChannelLoading(false)
    };

    if (notification.selectedChannel) fetchChannel();
  }, [cma, workspace, sdk, notification.selectedChannel]);

  const renderChannel = () => {
    if (channelLoading) return <Spinner className={styles.spinner} variant="default" />
    if (error) {
      return (
        <div className={styles.errorMessage}>
          <WarningIcon variant='warning' />
          <Text>Failed to load slack channel</Text>
        </div>
      )
    }
    return (
      <>
        {channel && <Tooltip content={channel?.name}><TextInput className={styles.channelInput} isDisabled value={channel?.name} /></Tooltip>}
        <Button onClick={openChannelListModal} size='small'>{channel ? 'Change channel' : 'Select channel'}</Button>
      </>
    )
  }

  return (
    <div className={styles.itemWrapper(!!notification.selectedContentType)}>
      <div className={styles.item}>
        <FormControl className={styles.select}>
          <FormControl.Label>Content type</FormControl.Label>
          <Select
            id="contentTypeSelect"
            name="contentTypeSelect"
            defaultValue={notification.selectedContentType || ''}
            onChange={(e) => {
              setSelectedContentType(e.target.value, index);
            }}>
            <Select.Option value="" isDisabled>
              Select a content type...
            </Select.Option>
            {contentTypes.map((contentType) => (
              <Select.Option key={contentType.sys.id} value={contentType.sys.id}>
                {contentType.name}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
        <Text className={styles.notifiesIn}>notifies in</Text>
          <FormControl className={styles.select}>
          <FormControl.Label>Selected Slack channel</FormControl.Label>
          <Flex alignItems='center' gap={tokens.spacingM} >
            {renderChannel()}
          </Flex>
          </FormControl>
          <IconButton
            icon={<DeleteIcon variant="secondary" />}
            aria-label="Delete notification"
            onClick={() => removeNotificationAtIndex(index)}
            variant="transparent"
            className={styles.delete}
          />
      </div>
      {notification.selectedContentType && (
        <Checkbox.Group value={selectedEvents}>
          {Object.values(SLACK_APP_EVENTS).map((event) => (
            <Checkbox
              key={event.id}
              id={`event-${event.id}-${index}`}
              value={`event-${event.id}-${index}`}
              onChange={() => {
                toggleEvent(event.id, index);
              }}>
              <Text fontWeight="fontWeightNormal" fontColor="gray500" marginRight="spacing2Xs">
                {getContentTypeName(notification.selectedContentType)}
              </Text>{' '}
              <Text fontWeight="fontWeightNormal" marginRight="spacing2Xs">
                {event.text}
              </Text>
            </Checkbox>
          ))}
        </Checkbox.Group>
      )}
    </div>
  );
};
