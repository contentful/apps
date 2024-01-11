import { expect } from 'chai';
import sinon from 'sinon';
import { handler } from './send-test';
import { makeMockAppActionCallContext } from '../../test/mocks';
import { SysLink, ContentTypeProps, ContentFields } from 'contentful-management';
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

  const cmaClientMockResponses: ContentTypeProps[] = [
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
  ];

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it('calls the cma to get the tenant id from app installation params', async () => {
    await handler(parameters, context);
    expect(cmaRequestStub).to.have.been.calledWithMatch({
      entityType: 'ContentType',
      action: 'get',
    });
  });
});
