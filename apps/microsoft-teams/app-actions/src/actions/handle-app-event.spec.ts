import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { AppInstallationProps } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import {
  AppActionCallResponseError,
  AppActionCallResponseSuccess,
  EntryActivity,
  EntryActivityMessage,
  SendEntryActivityMessageResult,
  SendMessageResult,
} from '../types';
import { makeMockAppActionCallContext, mockAppInstallation, mockEntry } from '../../test/mocks';
import { handler } from './handle-app-event';
import helpers from '../helpers';
import { config } from '../config';
import { MsTeamsBotService } from '../services/msteams-bot-service';

chai.use(sinonChai);

describe('handle-app-event.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;
  let buildEntryActivityStub: sinon.SinonStub;
  const mockEntryActivity = {} as EntryActivity;
  const sendMessageResult: SendMessageResult = {
    ok: true,
    data: { messageResponseId: 'message-response-id' },
  };
  const cmaClientMockResponses: [AppInstallationProps] = [mockAppInstallation];

  beforeEach(() => {
    const mockMsTeamsBotService = sinon.createStubInstance(MsTeamsBotService);
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
    buildEntryActivityStub = sinon.stub(helpers, 'buildEntryActivity').resolves(mockEntryActivity);
    sinon.stub(config, 'msTeamsBotService').value(mockMsTeamsBotService);
    mockMsTeamsBotService.sendEntryActivityMessage.resolves(sendMessageResult);
  });

  it('returns the ok result', async () => {
    const result = (await handler(
      {
        payload: JSON.stringify(mockEntry),
        topic: 'ContentManagement.Entry.publish',
        eventDatetime: '2024-01-18T21:43:54.267Z',
      },
      context
    )) as AppActionCallResponseSuccess<SendEntryActivityMessageResult[]>;

    expect(result).to.have.property('ok', true);
    expect(result.data).to.deep.include({
      sendMessageResult: { ok: true, data: { messageResponseId: 'message-response-id' } },
      entryActivityMessage: {
        channel: {
          channelId: 'channel-id',
          teamId: 'team-id',
        },
        entryActivity: mockEntryActivity,
      },
    });
  });

  describe('when an error is encountered', () => {
    beforeEach(() => {
      buildEntryActivityStub.throws('Boom!');
    });

    it('returns the ok result', async () => {
      const result = (await handler(
        {
          payload: JSON.stringify(mockEntry),
          topic: 'ContentManagement.Entry.publish',
          eventDatetime: '2024-01-18T21:43:54.267Z',
        },
        context
      )) as AppActionCallResponseError;

      expect(result).to.have.property('ok', false);
      expect(result.error).to.have.property('type', 'Error');
    });
  });
});
