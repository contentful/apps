import { ChatPostMessageResponse } from '@slack/web-api';
import { createStubInstance, SinonStubbedInstance, stub } from 'sinon';
import { assert, mockRequest, mockResponse, runHandler } from '../../../test/utils';
import { UnprocessableEntityException, ConflictException, NotFoundException } from '../../errors';
import { AuthToken } from '../../interfaces';
import { AuthTokenRepository } from '../auth-token';
import { MessagesController } from './controller';
import { MessagesRepository } from './repository';

describe('MessagesController', () => {
  let instance: MessagesController;
  let oAuthRepository: SinonStubbedInstance<AuthTokenRepository>;
  let messagesRepository: SinonStubbedInstance<MessagesRepository>;

  beforeEach(() => {
    oAuthRepository = createStubInstance(AuthTokenRepository);
    messagesRepository = createStubInstance(MessagesRepository);

    instance = new MessagesController(oAuthRepository, messagesRepository);
  });

  describe('#post', () => {
    it('throws UnprocessableEntityException for invalid body', async () => {
      const request = mockRequest({
        body: {
          not: 'the',
          correct: 'body',
          values: '.',
        },
        headers: {
          ['x-contentful-space-id']: 'space123',
          ['x-contentful-environment-id']: 'env123',
          ['x-contentful-crn']: 'crn:contentful:space:space123',
        },
      });
      const next = stub();
      const response = mockResponse();

      await runHandler(instance.post(request, response, next));

      const error = next.getCall(0).args[0];
      assert.instanceOf(error, UnprocessableEntityException);
    });

    it('throws ConflictException when required headers are missing', async () => {
      const request = mockRequest({
        body: { workspaceId: 'workspace123', message: 'Hello World!', channelId: 'channel123' },
        headers: {},
      });
      const next = stub();
      const response = mockResponse();

      await runHandler(instance.post(request, response, next));

      const error = next.getCall(0).args[0];
      assert.instanceOf(error, ConflictException);
      assert.include(error.details?.errMessage, 'EnvironmentId or spaceId not found in headers');
    });

    it('returns correct response on successful message creation', async () => {
      const slackResponse = {
        ok: true,
        channel: 'channel123',
        ts: '1234567890.123456',
        message: { text: 'Hello World!' },
      } as ChatPostMessageResponse;

      oAuthRepository.get.resolves({ token: 'slack-token-123' } as AuthToken);
      messagesRepository.create.resolves(slackResponse);

      const request = mockRequest({
        body: { workspaceId: 'workspace123', message: 'Hello World!', channelId: 'channel123' },
        headers: {
          ['x-contentful-space-id']: 'space123',
          ['x-contentful-environment-id']: 'env123',
          ['x-contentful-crn']: 'crn:contentful:space:space123',
        },
      });
      const next = stub();
      const statusStub = stub().returnsThis();
      const jsonStub = stub().returnsThis();
      const response = mockResponse({
        status: statusStub,
        json: jsonStub,
      });

      await runHandler(instance.post(request, response, next));

      assert.calledWith(statusStub, 200);
      assert.calledWith(jsonStub, slackResponse);
      assert.notCalled(next);
    });
  });
});
