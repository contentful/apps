import { expect } from 'chai';
import { transformInstallationsToChannelsList, sortChannels } from './get-channels-list';
import { mockTeamInstallations, mockChannels } from '../../test/mocks';

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

describe('sortChannels', () => {
  it('sorts teams and and channels in the correct order', () => {
    const sortedChannels = mockChannels.sort(sortChannels);

    expect(sortedChannels[0].teamName).to.equal('Marketing Team');
    expect(sortedChannels[0].name).to.equal('General');
    expect(sortedChannels[1].name).to.equal('Branding');
    expect(sortedChannels[3].teamName).to.equal('Sales Team');
  });
});
