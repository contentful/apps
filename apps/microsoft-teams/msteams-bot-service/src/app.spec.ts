import app from './app';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { MsTeamsConversationService } from './services/ms-teams-conversation-service';
import sinon from 'sinon';
import { makeMockConversationBot } from '../test/mocks';

chai.use(chaiHttp);

describe('app', () => {
  describe('GET /health', () => {
    it('responds with 200', async () => {
      const response = await chai.request(app).get('/health');
      expect(response).to.have.status(200);
    });
  });

  // TODO: Re-configure as integration test with less mocking
  describe('GET /api/messages', () => {
    beforeEach(() => {
      const mockConversationBot = makeMockConversationBot();
      const testConversationService = new MsTeamsConversationService(mockConversationBot);
      sinon.stub(MsTeamsConversationService, 'fromBotCredentials').returns(testConversationService);
    });

    const installationUpdateActivity = { type: 'InstallationUpdate', action: 'add' };

    it('responds with 200', async () => {
      const response = await chai
        .request(app)
        .post('/api/messages')
        .set('Authorization', 'Bearer abc123')
        .send(installationUpdateActivity);
      expect(response).to.have.status(200);
    });
  });
});
