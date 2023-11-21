import chai, { expect } from 'chai';
import sinon from 'sinon';
import { handler } from './list-channels';
import { makeMockAppActionCallContext } from '../../test/mocks';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponseSuccess, Channel } from '../types';
import { mockChannels } from '../../test/fixtures/mockChannelts';
import sinonChai from 'sinon-chai';

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
  });

  it('returns the ok result', async () => {
    const result = (await handler({ tenantId }, context)) as AppActionCallResponseSuccess<
      Channel[]
    >;

    expect(result).to.have.property('ok', true);
    expect(result).to.have.property('data', mockChannels);
  });
});
