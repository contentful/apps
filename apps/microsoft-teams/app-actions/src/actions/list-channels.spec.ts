import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { handler } from './list-channels';
import { AppActionResultSuccess } from '../../../types';
import { Channel } from '../../../types';
import { makeMockAppActionCallContext, mockChannels } from '../../test/mocks';
import helpers from '../helpers';

chai.use(sinonChai);

describe('listChannels.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;
  const tenantId = 'test-tenant-id';

  const cmaClientMockResponses: [AppInstallationProps] = [
    {
      sys: {
        type: 'AppInstallation',
        appDefinition: {} as SysLink,
        environment: {} as SysLink,
        space: {} as SysLink,
        organization: {} as SysLink,
        version: 1,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
      parameters: {
        tenantId,
      },
    },
  ];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
    sinon.stub(helpers, 'getChannelsList').returns(Promise.resolve(mockChannels));
  });

  it('returns the ok result', async () => {
    const result = (await handler(
      {
        tenantId,
      },
      context
    )) as AppActionResultSuccess<Channel[]>;

    expect(result).to.have.property('ok', true);
    expect(result).to.have.property('data', mockChannels);
  });
});
