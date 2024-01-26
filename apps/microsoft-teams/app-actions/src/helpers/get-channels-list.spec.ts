import { expect } from 'chai';
import { transformInstallationsToChannelsList } from './get-channels-list';
import { mockChannels } from '../../test/fixtures/mockChannels';
import { mockTeamInstallations } from '../../test/mocks';

describe('transformInstallationsToChannelsList', () => {
  it('formats installation data to channels list', () => {
    const channelsList = transformInstallationsToChannelsList(
      mockTeamInstallations,
      '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668'
    );

    expect(channelsList).to.eql(mockChannels);
  });

  it('ignores duplicate team installations', () => {
    const channelsList = transformInstallationsToChannelsList(
      [...mockTeamInstallations, mockTeamInstallations[0]],
      '666e56a6-1f2a-47c7-b88c-1ed9e1bb8668'
    );

    expect(channelsList).to.eql(mockChannels);
  });
});
