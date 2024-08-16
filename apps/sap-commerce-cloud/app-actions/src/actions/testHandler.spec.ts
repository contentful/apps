import { expect } from 'chai';
import sinon from 'sinon';
import { makeMockAppActionCallContext } from '../../test/mocks';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { handler } from './testHandler';

describe('testHandler.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;

  const cmaClientMockResponses: [AppInstallationProps] = [
    {
      sys: {
        type: 'AppInstallation',
        appDefinition: {} as SysLink,
        environment: {} as SysLink,
        space: {} as SysLink,
        version: 1,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
      parameters: {
        sapApiEndpoint: 'sap-endpoint',
        apiKey: 'sap-api-key',
      },
    },
  ];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it('returns the base sites result', async () => {
    const result = await handler(
      { sapApiEndpoint: 'sap-endpoint', apiKey: 'sap-api-key' },
      context
    );

    expect(result).to.have.property('ok', true);
  });
});
