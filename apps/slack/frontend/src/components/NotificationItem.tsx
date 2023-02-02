import React, { useMemo } from 'react';
import { Paragraph, Checkbox, IconButton, Text } from '@contentful/f36-components';
import { DeleteIcon } from '@contentful/f36-icons';
import { Select, FormControl } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import { SlackChannelSimplified } from '../workspace.store';
import { ContentTypeProps } from 'contentful-management';
import { SlackNotification, useNotificationStore } from '../notification.store';

const styles = {
  itemWrapper: (withMargin: boolean) =>
    css({
      marginBottom: tokens.spacingL,
      paddingBottom: withMargin ? tokens.spacingL : '0',
      borderBottom: `1px solid ${tokens.gray300}`,
    }),
  item: css({
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  }),
  notifiesIn: css({
    lineHeight: '18px',
    margin: `11px ${tokens.spacingL} calc(${tokens.spacingM} + 11px) ${tokens.spacingL}`,
  }),
  select: css({
    flex: 1,
    marginBottom: tokens.spacingM,
  }),
  delete: css({
    height: tokens.spacingXl,
    margin: `0 0 ${tokens.spacingM} ${tokens.spacingS}`,
    padding: `0 ${tokens.spacing2Xs}`,
  }),
};

interface NotificationItemProps {
  notification: SlackNotification;
  channels: SlackChannelSimplified[];
  index: number;
  contentTypes: ContentTypeProps[];
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
  channels,
  contentTypes,
  notification,
  index,
}: NotificationItemProps) => {
  const { setSelectedChannel, setSelectedContentType, toggleEvent, removeNotificationAtIndex } =
    useNotificationStore((state) => ({
      setSelectedChannel: state.setSelectedChannel,
      setSelectedContentType: state.setSelectedContentType,
      toggleEvent: state.toggleEvent,
      removeNotificationAtIndex: state.removeNotificationAtIndex,
    }));

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
          <FormControl.Label>Slack channel</FormControl.Label>
          <Select
            id="channel"
            name="channel"
            defaultValue={notification.selectedChannel || ''}
            onChange={(e) => {
              setSelectedChannel(e.target.value, index);
            }}>
            <Select.Option value="" isDisabled>
              Select a Slack channel...
            </Select.Option>
            {channels.map((channel) => (
              <Select.Option key={channel.id} value={channel.id}>
                {channel.name}
              </Select.Option>
            ))}
          </Select>
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
