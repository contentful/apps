import { describe, it, expect } from 'vitest';
import { getChannelName, getContentTypeName, isNotificationReadyToSave } from './configHelpers';
import mockChannels from '@test/mocks/mockChannels.json';
import { mockContentType } from '@test/mocks';
import { channelSelection, contentTypeSelection } from '@constants/configCopy';
import { defaultNotification } from '@constants/defaultParams';
import { mockNotification } from '@test/mocks';

describe('getChannelName', () => {
  it('should return the channel name', () => {
    expect(
      getChannelName(
        '19:e3a386bd1e0f4e00a286b4e86b0cfbe9@thread.tacv2',
        mockChannels,
        channelSelection.notFound
      )
    ).toEqual('General, Marketing Team');
  });

  it('should return not found message if channel does not exist', () => {
    expect(getChannelName('test-not-found', mockChannels, channelSelection.notFound)).toEqual(
      channelSelection.notFound
    );
  });
});

describe('getContentTypeName', () => {
  it('should return the channel name', () => {
    expect(getContentTypeName('page', [mockContentType], contentTypeSelection.notFound)).toEqual(
      'Page'
    );
  });

  it('should return not found message if channel does not exist', () => {
    expect(
      getContentTypeName('test-not-found', [mockContentType], contentTypeSelection.notFound)
    ).toEqual(contentTypeSelection.notFound);
  });
});

describe('isNotificationReadyToSave', () => {
  it('should return false when it is not ready', () => {
    expect(isNotificationReadyToSave(defaultNotification)).toEqual(false);
  });

  it('should return true when it is ready', () => {
    expect(isNotificationReadyToSave(mockNotification)).toEqual(true);
  });
});
