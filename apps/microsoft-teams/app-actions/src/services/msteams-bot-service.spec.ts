import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { MsTeamsBotService } from './msteams-bot-service';
import { makeMockFetchResponse, mockTeamInstallation } from '../../test/mocks';
import { EntryActivityMessage } from '../types';

chai.use(sinonChai);

describe('MsTeamsBotService', () => {
  const botServiceUrl = 'https://example.com';
  const apiKey = 'apiKey';
  const tenantId = 'tenant-id';
  const entryActivityMessage = { channel: {} } as EntryActivityMessage;
  const msTeamsBotService = new MsTeamsBotService(botServiceUrl, apiKey);
  const messageResponseId = 'messageResponseId';
  let stubbedFetch: sinon.SinonStub;

  beforeEach(() => {
    const body = {
      ok: true,
      data: { messageResponseId },
    };
    const mockFetchResponse = makeMockFetchResponse(body);
    stubbedFetch = sinon.stub(global, 'fetch');
    stubbedFetch.resolves(mockFetchResponse);
  });

  describe('sendEntryActivityMessage', () => {
    it('returns the result object from the service', async () => {
      const result = await msTeamsBotService.sendEntryActivityMessage(
        entryActivityMessage,
        tenantId
      );
      expect(result).to.have.property('ok', true);
    });

    it('calls fetch with the appropriate values', async () => {
      await msTeamsBotService.sendEntryActivityMessage(entryActivityMessage, tenantId);
      expect(stubbedFetch).to.have.been.calledWith(
        'https://example.com/api/tenant/tenant-id/entry_activity_messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'apiKey',
          },
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
      const result = await msTeamsBotService.getTeamInstallations(tenantId);
      expect(result).to.have.property('ok', true);
    });

    it('calls fetch with the appropriate values', async () => {
      await msTeamsBotService.getTeamInstallations(tenantId);
      expect(stubbedFetch).to.have.been.calledWith(
        'https://example.com/api/tenants/tenant-id/team_installations',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'apiKey',
          },
        }
      );
    });
  });
});
