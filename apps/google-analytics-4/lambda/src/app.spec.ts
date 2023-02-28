import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon, { SinonStubbedInstance } from 'sinon';
import {
  mockAnalyticsAdminServiceClient,
  validServiceAccountKeyFile,
  validServiceAccountKeyFileBase64,
  validServiceAccountKeyIdBase64,
} from '../test/mocks/googleApi';
import app from './app';
import { GoogleApi } from './services/google-api';
import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

chai.use(chaiHttp);

const serviceAccountKeyHeaders = {
  'x-contentful-serviceaccountkeyid': validServiceAccountKeyIdBase64,
  'x-contentful-serviceaccountkey': validServiceAccountKeyFileBase64,
};

describe('app', () => {
  let mockAdminClient: SinonStubbedInstance<AnalyticsAdminServiceClient>;
  let mockDataClient: SinonStubbedInstance<BetaAnalyticsDataClient>;

  beforeEach(() => {
    // TODO: set headers and fully test signature verification later
    sinon.stub(NodeAppsToolkit, 'verifyRequest').get(() => {
      return () => true;
    });
  });

  describe('GET /health', () => {
    it('responds with 204', async () => {
      const response = await chai.request(app).get('/health');
      expect(response).to.have.status(204);
    });
  });

  describe('GET /api/credentials', () => {
    it('responds with 200', async () => {
      const response = await chai
        .request(app)
        .get('/api/credentials')
        .set(serviceAccountKeyHeaders);
      expect(response).to.have.status(200);
    });

    it('returns the expected response body', async () => {
      const response = await chai
        .request(app)
        .get('/api/credentials')
        .set(serviceAccountKeyHeaders);
      expect(response.body).to.have.property('status', 'active');
    });
  });

  // TODO: These test need to be updated once we have everything configured
  describe('GET /api/account_summaries', () => {
    let googleApi: GoogleApi;

    beforeEach(() => {
      mockAdminClient = mockAnalyticsAdminServiceClient();
      googleApi = new GoogleApi(validServiceAccountKeyFile, mockAdminClient, mockDataClient);
      sinon.stub(GoogleApi, 'fromServiceAccountKeyFile').returns(googleApi);
    });

    it('responds with 200', async () => {
      const response = await chai
        .request(app)
        .get('/api/account_summaries')
        .set(serviceAccountKeyHeaders);
      expect(response).to.have.status(200);
    });

    it('returns the expected response body', async () => {
      const response = await chai
        .request(app)
        .get('/api/account_summaries')
        .set(serviceAccountKeyHeaders);
      expect(response.body[0]).to.have.property('propertySummaries');
    });
  });

  describe('GET /api/run_report', () => {


    it('responds with 200 for sample with views data', async () => {
      const response = await chai.request(app).get('/sampleData/runReportResponseHasViews.json');
      expect(response).to.have.status(200);
    });

    it('responds with 200 for sample with no views data', async () => {
      const response = await chai.request(app).get('/sampleData/runReportResponseNoViews.json');
      expect(response).to.have.status(200);
    });
  });
});
