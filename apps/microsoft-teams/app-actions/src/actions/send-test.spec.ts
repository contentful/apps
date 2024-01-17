import { expect } from 'chai';
import sinon from 'sinon';
import { handler } from './send-test';
import { makeMockAppActionCallContext } from '../../test/mocks';
import {
  SysLink,
  ContentTypeProps,
  ContentFields,
  AppInstallationProps,
} from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import helpers from '../helpers';
import { AppActionCallResponseSuccess } from '../types';

describe('sendTestNotification.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;

  const parameters = {
    channelId: '111-222',
    teamId: '333-444',
    contentTypeId: 'blogPost',
    spaceName: 'My test space',
  };
  const tenantId = 'msteams-tenant-id';

  const cmaClientMockResponses: (ContentTypeProps | AppInstallationProps)[] = [
    {
      sys: {
        type: 'ContentType',
        id: 'blogPost',
        version: 1,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        environment: {} as SysLink,
        space: {} as SysLink,
      },
      name: 'Blog Post',
      description: 'description',
      displayField: 'displayField',
      fields: [] as ContentFields[],
    },
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
        tenantId: tenantId,
      },
    },
  ];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
    sinon
      .stub(helpers, 'sendTestNotification')
      .returns(Promise.resolve({ ok: true, data: 'message-id' }));
  });

  it('calls the cma to get the content type name', async () => {
    await handler(parameters, context);
    expect(cmaRequestStub).to.have.been.calledWithMatch({
      entityType: 'ContentType',
      action: 'get',
    });
  });

  it('returns the ok result', async () => {
    const result = (await handler(parameters, context)) as AppActionCallResponseSuccess<string>;
    expect(result).to.have.property('ok', true);
    expect(result).to.have.property('data', 'message-id');
  });
});
