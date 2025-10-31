import { createStubInstance, match, SinonStub, SinonStubbedInstance, stub } from 'sinon';

import { AuthTokenController } from './controller';
import { AuthTokenRepository } from './repository';
import { mockRequest, mockResponse, assert, runHandler } from '../../../test/utils';
import { UnprocessableEntityException } from '../../errors';
import { AuthToken } from '../../interfaces';

const DEFAULT_FRONTEND_URL = 'http://example.com';
const DEFAULT_MOCKED_GET_REQUEST = mockRequest({
  query: {
    code: 'code',
    spaceId: 'spaceId',
    environmentId: 'environmentId',
  },
});
const DEFAULT_MOCKED_POST_REQUEST = mockRequest({
  params: {
    spaceId: 'spaceId',
    environmentId: 'environmentId',
  },
  headers: {
    ['x-contentful-space-id']: 'space-id',
    ['x-contentful-environment-id']: 'main',
    ['x-contentful-uuid']: '1234',
  },
  body: {
    refreshToken: 'validToken',
  },
});

describe('AuthTokenController', () => {
  let instance: AuthTokenController;
  let oAuthRepository: SinonStubbedInstance<AuthTokenRepository>;
  let next: SinonStub;

  beforeEach(() => {
    oAuthRepository = createStubInstance(AuthTokenRepository);
    next = stub();
    instance = new AuthTokenController(oAuthRepository, DEFAULT_FRONTEND_URL);
  });

  describe('#get', () => {
    describe('when validating the input', () => {
      it('throws UnprocessableEntity on invalid parameters', async () => {
        const request = mockRequest({
          query: { code: 888, spaceId: false, environmentId: undefined },
        });
        await runHandler(instance.get(request, mockResponse(), next));

        const error = next.getCall(0).args[0];

        assert.include(error.details?.error[0], {
          schemaPath: '#/required',
          keyword: 'required',
        });
        assert.include(error.details?.error[1], {
          schemaPath: '#/properties/code/type',
          keyword: 'type',
        });
        assert.include(error.details?.error[2], {
          schemaPath: '#/properties/spaceId/type',
          keyword: 'type',
        });
      });

      it('does not throw UnprocessableEntity otherwise', async () => {
        await runHandler(instance.get(DEFAULT_MOCKED_GET_REQUEST, mockResponse(), next));

        const args = next.getCalls().reduce((acc, call) => {
          acc.push(...call.args);
          return acc;
        }, [] as unknown[]);

        for (const arg of args) {
          assert.notInstanceOf(arg, UnprocessableEntityException);
        }
      });
    });

    describe('when returning the success response', () => {
      it('renders a html view performing a client side redirect', async () => {
        const authToken = {
          slackWorkspaceId: 'team-id',
          token: 'token',
          refreshToken: 'fresh',
        } as AuthToken;
        oAuthRepository.validate.resolves(authToken);

        const response = mockResponse();
        await runHandler(instance.get(DEFAULT_MOCKED_GET_REQUEST, response, next));

        assert.calledWith(response.status, 200);
        assert.calledWith(response.header, 'content-type', 'text/html');
        assert.calledWithMatch(
          response.send,
          match((m) =>
            m.includes(
              `${DEFAULT_FRONTEND_URL}/?accessToken=${authToken.token}&refreshToken=${authToken.refreshToken}&state=${authToken.slackWorkspaceId}&result=ok`
            )
          )
        );
      });
    });

    describe('when returning the error response', () => {
      it('renders a html view performing a client side redirect', async () => {
        oAuthRepository.validate.rejects(new Error('AAAAAARGH'));

        const request = mockRequest({
          query: {
            code: 'code',
            spaceId: 'spaceId',
            environmentId: 'environmentId',
          },
        });

        const response = mockResponse();
        await runHandler(instance.get(request, response, next));

        assert.calledWith(response.status, 200);
        assert.calledWith(response.header, 'content-type', 'text/html');
        assert.calledWithMatch(
          response.send,
          match((m) => m.includes(`${DEFAULT_FRONTEND_URL}/?result=error&errorMessage=AAAAAARGH`))
        );
      });
    });
  });

  describe('#post', () => {
    describe('when validating the input', () => {
      it('throws UnprocessableEntity on invalid body', async () => {
        const request = mockRequest({
          body: {
            refreshToken: true,
            aPropertyToBe: 'ignored',
          },
          headers: {
            ['x-contentful-space-id']: 'space-id',
            ['x-contentful-environment-id']: 'main',
            ['x-contentful-uuid']: '1234',
          },
        });
        await runHandler(instance.post(request, mockResponse(), next));

        const error = next.getCall(0).args[0];

        assert.include(error.details?.error[0], {
          schemaPath: '#/properties/refreshToken/type',
          keyword: 'type',
        });
      });

      it('throws NotFoundError on invalid headers', async () => {
        const request = mockRequest({
          body: {
            refreshToken: true,
            aPropertyToBe: 'ignored',
          },
          headers: {
            ['x-contentful-environment-id']: 'main',
          },
        });
        await runHandler(instance.post(request, mockResponse(), next));

        const error = next.getCall(0).args[0];

        assert.equal(error.status, 404);
      });

      it('does not throw UnprocessableEntity otherwise', async () => {
        await runHandler(instance.post(DEFAULT_MOCKED_POST_REQUEST, mockResponse(), next));

        const args = next.getCalls().reduce((acc, call) => {
          acc.push(...call.args);
          return acc;
        }, [] as unknown[]);

        for (const arg of args) {
          assert.notInstanceOf(arg, UnprocessableEntityException);
        }
      });
    });

    describe('when returning the success response', () => {
      it('returns an access token', async () => {
        const authToken = {
          slackWorkspaceId: 'team-id',
          installationUuid: '1234',
          token: 'token',
          refreshToken: 'fresh',
        } as AuthToken;
        oAuthRepository.put.resolves(authToken);

        const response = mockResponse();
        await runHandler(instance.post(DEFAULT_MOCKED_POST_REQUEST, response, next));

        assert.calledWith(response.status, 201);
        assert.calledWith(response.send, { token: 'token' });
      });
    });
  });
});
