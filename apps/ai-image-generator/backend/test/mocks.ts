import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { Adapter, PlainClientAPI, createClient } from 'contentful-management';
import sinon from 'sinon';

export const makeMockPlainClient = (stub: sinon.SinonStub): PlainClientAPI => {
  const apiAdapter: Adapter = {
    makeRequest: (args) => {
      return stub.returns(Promise.resolve())(args);
    },
  };
  return createClient({ apiAdapter }, { type: 'plain' });
};

export const makeMockAppActionCallContext = (cmaStub = sinon.stub()): AppActionCallContext => {
  return {
    cma: makeMockPlainClient(cmaStub),
    appActionCallContext: {
      spaceId: 'space-id',
      environmentId: 'environment-id',
      appInstallationId: 'app-installation-id',
      userId: 'user-id',
    },
  };
};
