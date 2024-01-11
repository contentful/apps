import { expect } from 'chai';
import sinon from 'sinon';
import { handler } from './send-test';
import { makeMockAppActionCallContext } from '../../test/mocks';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';

describe('sendTestNotification.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;

  const parameters = {
    channelId: '111-222',
    teamId: '333-444',
    contentTypeId: 'blogPost',
    spaceName: 'My test space',
  };

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
        tenantId: 'my-tenant-id',
      },
    },
  ];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it('calls the cma to get the tenant id from app installation params', async () => {
    await handler(parameters, context);
    expect(cmaRequestStub).to.have.been.calledWithMatch({
      entityType: 'AppInstallation',
      action: 'get',
    });
  });
});
