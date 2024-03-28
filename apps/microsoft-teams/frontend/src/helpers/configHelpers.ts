import { ContentTypeProps } from 'contentful-management';
import { Notification } from '@customTypes/configPage';
import isEqual from 'lodash/isEqual';
import { defaultNotification } from '@constants/defaultParams';

/**
 * Checks to see if a given content type id is valid based on the content types available
 * @param contentTypeId
 * @param contentTypes
 * @returns boolean
 */
const isContentTypeValid = (contentTypeId: string, contentTypes: ContentTypeProps[]): boolean => {
  const contentType = contentTypes.find((contentType) => contentType.sys.id === contentTypeId);
  return !!contentType;
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
  const hasChanges = doesNotificationHaveChanges(editedNotification, notification);
  const hasAllFieldsCompleted = areAllFieldsCompleted(editedNotification);

  return hasChanges && hasAllFieldsCompleted;
};

/**
 * Evaluates whether a test notification can be sent based on whether all necessary fields are completed
 * @param editedNotification
 * @param notification
 * @returns boolean
 */
const canTestNotificationBeSent = (
  editedNotification: Notification,
  notification: Notification
): boolean => {
  const hasChanges = doesNotificationHaveChanges(editedNotification, notification);
  const hasAllFieldsCompleted = areAllFieldsCompleted(
    hasChanges ? editedNotification : notification
  );

  return hasAllFieldsCompleted;
};

/**
 * Evaluates whether all necessary fields (content type, channel, events) are completed for a given notification
 * @param notification
 * @returns boolean
 */
const areAllFieldsCompleted = (notification: Notification): boolean => {
  const hasContentType = !!notification.contentTypeId;
  const hasChannel = !!notification.channel.id;
  const hasEventEnabled = Object.values(notification.selectedEvents).includes(true);

  return hasContentType && hasChannel && hasEventEnabled;
};

/**
 * Evaluates whether the notification is a new notification
 * @param notification
 * @returns boolean
 */
const isNotificationNew = (notification: Notification): boolean => {
  return isEqual(notification, defaultNotification);
};

/**
 * Evaluates whether the notification has changes
 * @param editedNotification
 * @param notification
 * @returns boolean
 */
const doesNotificationHaveChanges = (
  editedNotification: Notification,
  notification: Notification
): boolean => {
  return !isEqual(editedNotification, notification);
};

/**
 * Returns a list of unique notifications with duplicates removed
 * Duplicates are ones that have the same content type and channel
 * @param notifications
 * @returns Notification[]
 */
const getUniqueNotifications = (notifications: Notification[]): Notification[] => {
  // Use a Set to keep track of unique keys
  const uniqueKeys = new Set<string>();

  // Deduplicate based on content
  const uniqueNotifications = notifications.filter((notification) => {
    const key = `${notification.channel.id}-${notification.contentTypeId}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      return true;
    }
    return false;
  });

  return uniqueNotifications;
};

/**
 * Finds the index of the notification that is a duplicate of another
 * @param notifications
 * @param notificationToFind
 * @param index
 * @returns number
 */
const getDuplicateNotificationIndex = (
  notifications: Notification[],
  notificationToFind: Notification,
  index?: number
): number => {
  const duplicateNotificationIndex = notifications.reduce((matchedIndex, notification, idx) => {
    const isDuplicate =
      notification.channel.id === notificationToFind.channel.id &&
      notification.contentTypeId === notificationToFind.contentTypeId &&
      index !== idx;
    if (isDuplicate) {
      matchedIndex = idx;
    }

    return matchedIndex;
  }, -1);

  return duplicateNotificationIndex;
};

export {
  isContentTypeValid,
  isNotificationReadyToSave,
  canTestNotificationBeSent,
  areAllFieldsCompleted,
  isNotificationNew,
  doesNotificationHaveChanges,
  getUniqueNotifications,
  getDuplicateNotificationIndex,
};
