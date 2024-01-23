import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { AppInstallationProps } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { EntryActivity } from '../types';
import { makeMockAppActionCallContext, mockAppInstallation, mockEntry } from '../../test/mocks';
import { handler } from './handle-app-event';
import helpers from '../helpers';

chai.use(sinonChai);

describe('handle-app-event.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;
  const mockEntryActivity = {} as EntryActivity;

  const cmaClientMockResponses: [AppInstallationProps] = [mockAppInstallation];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
    sinon.stub(helpers, 'buildEntryActivity').resolves(mockEntryActivity);
  });

  it('returns the ok result', async () => {
    const result = await handler(
      {
        payload: JSON.stringify(mockEntry),
        topic: 'ContentManagement.Entry.publish',
        eventDatetime: '2024-01-18T21:43:54.267Z',
      },
      context
    );

    expect(result).to.have.property('ok', true);
    expect(result).to.have.deep.property('data', {
      channel: {
        channelId: 'TODO-channel-id',
        teamId: 'TODO-team-id',
      },
      entryActivity: mockEntryActivity,
    });
  });
});
