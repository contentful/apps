import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { MsTeamsConversationService } from './ms-teams-conversation-service';
import { BotBuilderCloudAdapter } from '@microsoft/teamsfx';

import ConversationBot = BotBuilderCloudAdapter.ConversationBot;
import { Request, Response } from 'express';
import { makeMockConversationBot } from '../../test/mocks';

chai.use(sinonChai);

describe('MsteamsConversationService', () => {
  let msTeamsConverationService: MsTeamsConversationService;
  let mockConversationBot: sinon.SinonStubbedInstance<ConversationBot>;

  beforeEach(() => {
    mockConversationBot = makeMockConversationBot();
    msTeamsConverationService = new MsTeamsConversationService(mockConversationBot);
  });

  describe('handleRequest', () => {
    const mockRequest = {} as Request;
    const mockResponse = {
      status: () => ({
        send: () => {},
      }),
    } as unknown as Response;
    const logicFunction = async () => {};

    it('calls the requestHandler method of the conversation bot', async () => {
      await msTeamsConverationService.handleRequest(mockRequest, mockResponse, logicFunction);
      expect(mockConversationBot.requestHandler).to.have.been.calledWith(
        mockRequest,
        mockResponse,
        logicFunction
      );
    });
  });
});
