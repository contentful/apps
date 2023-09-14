import { AppInstallationProps, SysLink } from 'contentful-management';
import { fetchOpenAiApiKey } from './utils';
import sinon from 'sinon';
import { makeMockPlainClient } from '../test/mocks';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

describe('fetchOpenApiKey', () => {
  const cmaStub = sinon.stub();
  const openAiApiKey = 'openai-api-key';

  const mockAppInstallation: AppInstallationProps = {
    sys: {
      type: 'AppInstallation',
      appDefinition: {} as SysLink,
      environment: {} as SysLink,
      space: {} as SysLink,
      createdAt: 'createdAt',
      version: 1,
      updatedAt: 'updatedAt',
    },
    parameters: {
      apiKey: openAiApiKey,
    },
  };
  const cma = makeMockPlainClient([mockAppInstallation], cmaStub);
  const appInstallationId = 'appInstallationId';

  it('returns the apiKey', async () => {
    const result = await fetchOpenAiApiKey(cma, appInstallationId);
    expect(cmaStub).to.have.been.calledWithMatch({
      entityType: 'AppInstallation',
      action: 'get',
    });
    expect(result).to.eq(openAiApiKey);
  });
});
