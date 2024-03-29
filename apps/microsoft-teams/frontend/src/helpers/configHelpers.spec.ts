import { describe, it, expect } from 'vitest';
import {
  isItemValid,
  isNotificationReadyToSave,
  canTestNotificationBeSent,
  areAllFieldsCompleted,
  isNotificationNew,
  doesNotificationHaveChanges,
  getUniqueNotifications,
  getDuplicateNotificationIndex,
} from './configHelpers';
import { mockContentType, mockChannels } from '@test/mocks';
import { defaultNotification } from '@constants/defaultParams';
import { mockNotification } from '@test/mocks';

describe('isItemValid', () => {
  it('should return true if the channel is valid', () => {
    expect(
      isItemValid('19:e3a386bd1e0f4e00a286b4e86b0cfbe9@thread.tacv2', mockChannels, 'channel')
    ).toEqual(true);
  });

  it('should return false if the channel is not valid', () => {
    expect(isItemValid('channel-not-found', mockChannels, 'channel')).toEqual(false);
  });

  it('should return true if the content type is valid', () => {
    expect(isItemValid('page', [mockContentType], 'contentType')).toEqual(true);
  });

  it('should return false if the content type is not valid', () => {
    expect(isItemValid('ct-not-found', [mockContentType], 'contentType')).toEqual(false);
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

describe('canTestNotificationBeSent', () => {
  it('should return false when it is not ready to be sent', () => {
    expect(canTestNotificationBeSent(defaultNotification, defaultNotification)).toEqual(false);
  });

  it('should return true when it is ready to be sent', () => {
    expect(canTestNotificationBeSent(mockNotification, defaultNotification)).toEqual(true);
  });
});

describe('areAllFieldsCompleted', () => {
  it('should return false when fields are not completed', () => {
    expect(areAllFieldsCompleted(defaultNotification)).toEqual(false);
  });

  it('should return true when fields are completed', () => {
    expect(areAllFieldsCompleted(mockNotification)).toEqual(true);
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
        contentTypeName: 'Page',
      })
    ).toEqual(-1);
  });

  it('should return the correct index when there are duplicates', () => {
    expect(
      getDuplicateNotificationIndex(
        [mockNotification, { ...mockNotification, contentTypeId: 'page', contentTypeName: 'Page' }],
        mockNotification
      )
    ).toEqual(0);
  });

  it('should return the correct index when there are duplicates and index is passed in', () => {
    expect(
      getDuplicateNotificationIndex(
        [
          { ...mockNotification, contentTypeId: 'page', contentTypeName: 'Page' },
          mockNotification,
          mockNotification,
        ],
        mockNotification,
        2
      )
    ).toEqual(1);
  });
});
