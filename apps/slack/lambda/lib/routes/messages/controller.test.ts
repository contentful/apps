import { ChatPostMessageResponse } from '@slack/web-api';
import { createStubInstance, SinonStubbedInstance, stub } from 'sinon';
import { assert, mockRequest, mockResponse, runHandler } from '../../../test/utils';
import { UnprocessableEntityException } from '../../errors';
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
    it('throws a UnprocessableEntityException for invalid body', async () => {
      oAuthRepository.get.resolves({ token: 'token' } as AuthToken);
      messagesRepository.create.resolves({
        result: 'ok',
      } as unknown as ChatPostMessageResponse);
      const request = mockRequest({
        body: {
          not: 'the',
          correct: 'body',
          values: '.',
        },
      });
      const next = stub();
      await runHandler(instance.post(request, mockResponse(), next));

      const error = next.getCall(0).args[0];
      assert.instanceOf(error, UnprocessableEntityException);
    });

    it('returns correct status', async () => {
      const result = { ok: true };
      messagesRepository.create.resolves(result);
      oAuthRepository.get.resolves({ token: 'token' } as AuthToken);

      const request = mockRequest({
        body: { workspaceId: 'lol', message: 'message', channelId: 'channel' },
        headers: {
          ['x-contentful-space-id']: 'space',
          ['x-contentful-environment-id']: 'env',
        },
      });
      const next = stub();
      const response = mockResponse();
      await runHandler(instance.post(request, response, next));

      assert.calledWith(response.sendStatus, 204);
    });
  });
});
