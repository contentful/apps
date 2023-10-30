import { expect } from 'chai';
import sinon from 'sinon';
import { handler } from './send-test-notification';
import { makeMockAppActionCallContext } from '../../test/mocks';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';

describe('sendTestNotification.handler', () => {
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
      parameters: {},
    },
  ];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it('returns the ok result', async () => {
    const result = await handler({ channel: 'foo' }, context);
    expect(result).to.have.property('ok', true);
  });
});
