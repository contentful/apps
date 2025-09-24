import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { AppInstallationProps } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import {
  EntryActivity,
  SendEntryActivityMessageResult,
  MsTeamsBotServiceResponse,
  SendWorkflowUpdateMessageResult,
} from '../types';
import { MessageResponse, AppActionResultSuccess, AppActionResultError } from '../../../types';
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
  const sendMessageResult: MsTeamsBotServiceResponse<MessageResponse> = {
    ok: true,
    data: { messageResponseId: 'message-response-id' },
  };
  const sendWorkflowUpdateMessageResult: MsTeamsBotServiceResponse<MessageResponse> = {
    ok: true,
    data: { messageResponseId: 'workflow-message-response-id' },
  };
  const cmaClientMockResponses: [AppInstallationProps] = [mockAppInstallation];

  beforeEach(() => {
    const mockMsTeamsBotService = sinon.createStubInstance(MsTeamsBotService);
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
    buildEntryActivityStub = sinon.stub(helpers, 'buildEntryActivity').resolves(mockEntryActivity);
    sinon.stub(config, 'msTeamsBotService').value(mockMsTeamsBotService);
    mockMsTeamsBotService.sendEntryActivityMessage.resolves(sendMessageResult);
    mockMsTeamsBotService.sendWorkflowUpdateMessage.resolves(sendWorkflowUpdateMessageResult);
  });

  it('returns the ok result', async () => {
    const result = (await handler(
      {
        payload: JSON.stringify(mockEntry),
        topic: 'ContentManagement.Entry.publish',
        eventDatetime: '2024-01-18T21:43:54.267Z',
      },
      context
    )) as AppActionResultSuccess<SendEntryActivityMessageResult[]>;

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
    // ensures that notifications that don't match tenant id, content type, and selected events are filtered out
    expect(result.data.length).to.equal(1);
  });

  describe('handling workflow updates', () => {
    it('builds a workflow update message payload, and passes it to botService.sendWorkflowUpdateMessage()', async () => {
      buildEntryActivityStub.resolves({
        contentTypeName: 'blogPost',
        entryTitle: 'My Blog Post Title',
        action: 'published',
        eventDatetime: '2024-01-18T21:43:54.267Z',
        entryUrl: 'https://example.com/asdf',
        entryId: '1234',
      });

      try {
        const result = (await handler(
          {
            payload: JSON.stringify(mockEntry),
            topic: 'Workflow.Step.notifyMicrosoftTeams',
            eventDatetime: '2024-01-18T21:43:54.267Z',
          },
          context
        )) as AppActionResultSuccess<SendWorkflowUpdateMessageResult>;

        expect(result.ok).to.equal(true);
        expect(result.data.sendWorkflowUpdateResult.ok).to.equal(true);
        expect(result.data.workflowUpdateMessage).not.to.equal(undefined);
      } catch (err) {
        console.error(err);
      }
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
      )) as AppActionResultError;

      expect(result).to.have.property('ok', false);
      expect(result.error).to.have.property('type', 'Error');
    });
  });
});
