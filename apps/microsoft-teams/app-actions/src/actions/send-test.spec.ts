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
import { MsTeamsBotServiceResponse } from '../types';
import { AppActionResultSuccess, MessageResponse } from '../../../types';
import { MsTeamsBotService } from '../services/msteams-bot-service';
import { config } from '../config';

describe('sendTestMessage.handler', () => {
  let cmaRequestStub: sinon.SinonStub;
  let context: AppActionCallContext;

  const parameters = {
    channelId: '111-222',
    teamId: '333-444',
    contentTypeId: 'blogPost',
  };
  const tenantId = 'msteams-tenant-id';
  const msTeamsBotServiceResponse: MsTeamsBotServiceResponse<MessageResponse> = {
    ok: true,
    data: { messageResponseId: 'message-response-id' },
  };

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
        organization: {} as SysLink,
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
    const mockMsTeamsBotService = sinon.createStubInstance(MsTeamsBotService);
    sinon.stub(config, 'msTeamsBotService').value(mockMsTeamsBotService);
    mockMsTeamsBotService.sendTestMessage.resolves(msTeamsBotServiceResponse);
    cmaRequestStub = sinon.stub();
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
  });

  it('calls the cma to get the content type name', async () => {
    await handler(parameters, context);
    expect(cmaRequestStub).to.have.been.calledWithMatch({
      entityType: 'ContentType',
      action: 'get',
    });
  });

  it('returns the ok result', async () => {
    const result = (await handler(parameters, context)) as AppActionResultSuccess<MessageResponse>;
    expect(result).to.have.property('ok', true);
    expect(result.data).to.have.property('messageResponseId', 'message-response-id');
  });
});
