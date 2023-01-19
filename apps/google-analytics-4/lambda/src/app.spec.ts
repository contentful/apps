import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon, { SinonStubbedInstance } from 'sinon';
import {
  mockAnalyticsAdminServiceClient,
  validServiceAccountKeyFile,
} from '../test/mocks/googleApi';
import app from './app';
import { GoogleApi } from './services/google-api';

chai.use(chaiHttp);

describe('app', () => {
  let mockClient: SinonStubbedInstance<AnalyticsAdminServiceClient>;

  describe('GET /health', () => {
    it('responds with 204', async () => {
      const response = await chai.request(app).get('/health');
      expect(response).to.have.status(204);
    });
  });

  describe('GET /api/credentials', () => {
    it('responds with 200', async () => {
      const response = await chai.request(app).get('/api/credentials');
      expect(response).to.have.status(200);
    });

    it('returns the expected response body', async () => {
      const response = await chai.request(app).get('/api/credentials');
      expect(response.body).to.have.property('status', 'active');
    });
  });

  describe('GET /api/account_summaries', () => {
    let googleApi: GoogleApi;

    beforeEach(() => {
      mockClient = mockAnalyticsAdminServiceClient();
      googleApi = new GoogleApi(validServiceAccountKeyFile, mockClient);
      sinon.stub(GoogleApi, 'fromServiceAccountKeyFile').returns(googleApi);
    });

    it('responds with 200', async () => {
      const response = await chai.request(app).get('/api/account_summaries');
      expect(response).to.have.status(200);
    });

    it('returns the expected response body', async () => {
      const response = await chai.request(app).get('/api/account_summaries');
      expect(response.body[0]).to.have.property('propertySummaries');
    });
  });
});
