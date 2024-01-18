import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { AppInstallationProps, SysLink } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { AppActionCallResponseSuccess, Channel } from '../types';
import { makeMockAppActionCallContext, mockEntry } from '../../test/mocks';
import { handler } from './handle-app-event';

chai.use(sinonChai);

describe('handle-app-event.handler', () => {
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
    const result = (await handler(
      {
        payload: mockEntry,
        topic: 'ContentManagement.Entry.publish',
        eventDatetime: '2024-01-18T21:43:54.267Z',
      },
      context
    )) as AppActionCallResponseSuccess<boolean>;

    expect(result).to.have.property('ok', true);
    expect(result).to.have.property('data', true);
  });
});
