import { ContentTypeProps } from 'contentful-management';
import { Notification, TeamsChannel } from '@customTypes/configPage';

const getContentTypeName = (
  contentTypeId: string,
  contentTypes: ContentTypeProps[],
  notFoundCopy: string
): string => {
  const contentType = contentTypes.find((contentType) => contentType.sys.id === contentTypeId);
  return contentType ? contentType.name : notFoundCopy;
};

// TODO: update this when we start fetching channel installations
const getChannelName = (
  channelId: string,
  channels: TeamsChannel[],
  notFoundCopy: string
): string => {
  const channel = channels.find((channel) => channelId === channel.id);
  const displayName = channel ? `${channel.name}, ${channel.teamName}` : notFoundCopy;
  return displayName;
};

const isNotificationReadyToSave = (notification: Notification): boolean => {
  const hasContentType = !!notification.contentTypeId;
  const hasChannel = !!notification.channelId;
  const hasEventEnabled = Object.values(notification.selectedEvents).includes(true);

  return hasContentType && hasChannel && hasEventEnabled;
};

export { getContentTypeName, getChannelName, isNotificationReadyToSave };
