import { expect } from 'chai';
import { transformInstallationsToChannelsList } from './get-channels-list';
import { mockInstallations } from '../../test/fixtures/mockInstallations';
import { mockChannels } from '../../test/fixtures/mockChannels';

describe('transformInstallationsToChannelsList', () => {
  it('formats installation data to channels list', () => {
    const channelsList = transformInstallationsToChannelsList(
      mockInstallations,
      '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668'
    );

    expect(channelsList).to.eql(mockChannels);
  });

  it('ignores duplicate team installations', () => {
    const channelsList = transformInstallationsToChannelsList(
      [...mockInstallations, mockInstallations[0]],
      '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668'
    );

    expect(channelsList).to.eql(mockChannels);
  });
});
