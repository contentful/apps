import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { AppInstallationProps } from 'contentful-management';
import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import { MsTeamsBotService } from './msteams-bot-service';
import {
  makeMockFetchResponse,
  mockTeamInstallation,
  makeMockAppActionCallContext,
  mockAppInstallation,
  mockRequestHeaders,
} from '../../test/mocks';
import { AppActionRequestContext, EntryActivityMessage, TestMessage } from '../types';

chai.use(sinonChai);

describe('MsTeamsBotService', () => {
  const botServiceUrl = 'https://example.com';
  const apiKey = mockRequestHeaders['x-api-key'];
  const tenantId = 'tenant-id';
  const msTeamsBotService = new MsTeamsBotService(botServiceUrl, apiKey);
  const messageResponseId = 'messageResponseId';
  let stubbedFetch: sinon.SinonStub;
  let context: AppActionCallContext;
  let cmaRequestStub: sinon.SinonStub;
  const cmaClientMockResponses: [AppInstallationProps] = [mockAppInstallation];
  let mockRequestContext: AppActionRequestContext;

  beforeEach(() => {
    const body = {
      ok: true,
      data: { messageResponseId },
    };
    const mockFetchResponse = makeMockFetchResponse(body);
    stubbedFetch = sinon.stub(global, 'fetch');
    cmaRequestStub = sinon.stub();
    stubbedFetch.resolves(mockFetchResponse);
    context = makeMockAppActionCallContext(cmaClientMockResponses, cmaRequestStub);
    const { appInstallationId, environmentId, spaceId, userId } = context.appActionCallContext;
    mockRequestContext = { appInstallationId, environmentId, spaceId, userId };
  });

  describe('sendEntryActivityMessage', () => {
    const entryActivityMessage = { channel: {} } as EntryActivityMessage;

    it('returns the result object from the service', async () => {
      const result = await msTeamsBotService.sendEntryActivityMessage(
        entryActivityMessage,
        tenantId,
        context.appActionCallContext
      );
      expect(result).to.have.property('ok', true);
    });

    it('calls fetch with the appropriate values', async () => {
      await msTeamsBotService.sendEntryActivityMessage(
        entryActivityMessage,
        tenantId,
        mockRequestContext
      );
      expect(stubbedFetch).to.have.been.calledWith(
        'https://example.com/api/tenant/tenant-id/entry_activity_messages',
        {
          method: 'POST',
          headers: mockRequestHeaders,
          body: '{"channel":{}}',
        }
      );
    });
  });

  describe('sendTestMessage', () => {
    const testMessage = { channel: {} } as TestMessage;

    it('returns the result object from the service', async () => {
      const result = await msTeamsBotService.sendTestMessage(
        testMessage,
        tenantId,
        mockRequestContext
      );
      expect(result).to.have.property('ok', true);
    });

    it('calls fetch with the appropriate values', async () => {
      await msTeamsBotService.sendTestMessage(testMessage, tenantId, mockRequestContext);
      expect(stubbedFetch).to.have.been.calledWith(
        'https://example.com/api/tenant/tenant-id/test_messages',
        {
          method: 'POST',
          headers: mockRequestHeaders,
          body: '{"channel":{}}',
        }
      );
    });
  });

  describe('getTeamInstallations', () => {
    beforeEach(() => {
      const body = {
        ok: true,
        data: [mockTeamInstallation],
      };
      const mockFetchResponse = makeMockFetchResponse(body);
      stubbedFetch.resolves(mockFetchResponse);
    });

    it('returns the result object from the service', async () => {
      const result = await msTeamsBotService.getTeamInstallations(tenantId, mockRequestContext);
      expect(result).to.have.property('ok', true);
    });

    it('calls fetch with the appropriate values', async () => {
      await msTeamsBotService.getTeamInstallations(tenantId, mockRequestContext);
      expect(stubbedFetch).to.have.been.calledWith(
        'https://example.com/api/tenants/tenant-id/team_installations',
        {
          method: 'GET',
          headers: mockRequestHeaders,
        }
      );
    });
  });
});
