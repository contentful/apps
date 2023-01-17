import { createStubInstance, SinonStubbedInstance, stub } from 'sinon';
import { assert, mockRequest, mockResponse, runHandler } from '../../../test/utils';
import { UnprocessableEntityException } from '../../errors';
import { AuthToken } from '../../interfaces';
import { AuthTokenRepository } from '../auth-token';
import { WorkspacesController } from './controller';
import { WorkspacesRepository } from './repository';

describe('WorkspacesController', () => {
  let instance: WorkspacesController;
  let oAuthRepository: SinonStubbedInstance<AuthTokenRepository>;
  let workspacesRepository: SinonStubbedInstance<WorkspacesRepository>;

  beforeEach(() => {
    oAuthRepository = createStubInstance(AuthTokenRepository);
    workspacesRepository = createStubInstance(WorkspacesRepository);

    instance = new WorkspacesController(oAuthRepository, workspacesRepository);
  });

  describe('#get', () => {
    it('throws a UnprocessableEntityException for invalid parameters', async () => {
      oAuthRepository.get.resolves({ token: 'token' } as AuthToken);
      const request = mockRequest({
        params: {},
      });
      const next = stub();
      await runHandler(instance.get(request, mockResponse(), next));

      const error = next.getCall(0).args[0];
      assert.instanceOf(error, UnprocessableEntityException);
    });

    it('returns correct data', async () => {
      const information = { id: 'lol', name: 'lol', icon: {} };
      workspacesRepository.get.resolves(information);
      oAuthRepository.get.resolves({ token: 'token' } as AuthToken);

      const request = mockRequest({
        params: { workspaceId: 'lol', spaceId: 'space', environmentId: 'env' },
      });
      const next = stub();
      const response = mockResponse();
      await runHandler(instance.get(request, response, next));

      assert.calledWith(response.status, 200);
      assert.calledWith(response.send, information);
    });
  });
});
