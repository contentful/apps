import { describe, it, expect } from 'vitest';
import {
  getContentTypeName,
  isNotificationReadyToSave,
  isNotificationNew,
  doesNotificationHaveChanges,
  getUniqueNotifications,
  getDuplicateNotificationIndex,
} from './configHelpers';
import { mockContentType } from '@test/mocks';
import { contentTypeSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';
import { mockNotification } from '@test/mocks';

describe('getContentTypeName', () => {
  it('should return the content type name', () => {
    expect(getContentTypeName('page', [mockContentType], contentTypeSelection.notFound)).toEqual(
      'Page'
    );
  });

  it('should return not found message if content type does not exist', () => {
    expect(
      getContentTypeName('test-not-found', [mockContentType], contentTypeSelection.notFound)
    ).toEqual(contentTypeSelection.notFound);
  });
});

describe('isNotificationReadyToSave', () => {
  it('should return false when it is not ready', () => {
    expect(isNotificationReadyToSave(defaultNotification, defaultNotification)).toEqual(false);
  });

  it('should return true when it is ready', () => {
    expect(isNotificationReadyToSave(mockNotification, defaultNotification)).toEqual(true);
  });
});

describe('isNotificationNew', () => {
  it('should return false when a notification is not new', () => {
    expect(isNotificationNew(mockNotification)).toEqual(false);
  });

  it('should return true when a notification is new', () => {
    expect(isNotificationNew(defaultNotification)).toEqual(true);
  });
});

describe('doesNotificationHaveChanges', () => {
  it('should return false when there are no changes', () => {
    expect(doesNotificationHaveChanges(mockNotification, mockNotification)).toEqual(false);
  });

  it('should return true when there are changes', () => {
    expect(doesNotificationHaveChanges(mockNotification, defaultNotification)).toEqual(true);
  });
});

describe('getUniqueNotifications', () => {
  it('should return a list of unique notifications when there are duplicates', () => {
    expect(getUniqueNotifications([mockNotification, mockNotification]).length).toEqual(1);
  });
});

describe('getDuplicateNotificationIndex', () => {
  it('should return -1 when there are no duplicates', () => {
    expect(
      getDuplicateNotificationIndex([mockNotification], {
        ...mockNotification,
        contentTypeId: 'page',
      })
    ).toEqual(-1);
  });

  it('should return the correct index when there are duplicates', () => {
    expect(
      getDuplicateNotificationIndex(
        [mockNotification, { ...mockNotification, contentTypeId: 'page' }],
        mockNotification
      )
    ).toEqual(0);
  });

  it('should return the correct index when there are duplicates and index is passed in', () => {
    expect(
      getDuplicateNotificationIndex(
        [{ ...mockNotification, contentTypeId: 'page' }, mockNotification, mockNotification],
        mockNotification,
        2
      )
    ).toEqual(1);
  });
});
