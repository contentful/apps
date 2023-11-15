import { ContentTypeProps } from 'contentful-management';
import { Notification, TeamsChannel } from '@customTypes/configPage';
import isEqual from 'lodash/isEqual';
import { defaultNotification } from '@constants/defaultParams';

/**
 * Gets the content type name for a given content type id
 * returns a not found string if the content type is not found
 * @param contentTypeId
 * @param contentTypes
 * @param notFoundCopy
 * @returns string
 */
const getContentTypeName = (
  contentTypeId: string,
  contentTypes: ContentTypeProps[],
  notFoundCopy: string
): string => {
  const contentType = contentTypes.find((contentType) => contentType.sys.id === contentTypeId);
  return contentType ? contentType.name : notFoundCopy;
};

// TODO: update this function when we start fetching channel installations
/**
 * Gets the channel and team name for a given channel id
 * returns a not found string if the channel is not found
 * @param channelId
 * @param channels
 * @param notFoundCopy
 * @returns string
 */
const getChannelName = (
  channelId: string,
  channels: TeamsChannel[],
  notFoundCopy: string
): string => {
  const channel = channels.find((channel) => channelId === channel.id);
  const displayName = channel ? `${channel.name}, ${channel.teamName}` : notFoundCopy;
  return displayName;
};

/**
 * Evaluates whether the edited notification is different from the saved notification
 * and whether all of the necessary fields are completed
 * @param editedNotification
 * @param notification
 * @returns boolean
 */
const isNotificationReadyToSave = (
  editedNotification: Notification,
  notification: Notification
): boolean => {
  const hasChanges = !isEqual(editedNotification, notification);

  const hasContentType = !!editedNotification.contentTypeId;
  const hasChannel = !!editedNotification.channelId;
  const hasEventEnabled = Object.values(editedNotification.selectedEvents).includes(true);
  const hasAllFieldsCompleted = hasContentType && hasChannel && hasEventEnabled;

  return hasChanges && hasAllFieldsCompleted;
};

/**
 * Evaluates whether the edited notification is different from the default notification
 * @param editedNotification
 * @returns boolean
 */
const isNotificationDefault = (editedNotification: Notification): boolean => {
  return isEqual(editedNotification, defaultNotification);
};

export { getContentTypeName, getChannelName, isNotificationReadyToSave, isNotificationDefault };
