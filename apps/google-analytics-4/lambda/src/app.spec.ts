import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon, { SinonStubbedInstance } from 'sinon';
import {
  mockAnalyticsAdminServiceClient,
  validServiceAccountKeyFile,
  validServiceAccountKeyIdBase64,
} from '../test/mocks/googleApi';
import app from './app';
import { GoogleApiService } from './services/googleApiService';
import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { DynamoDBService } from './services/dynamoDbService';

chai.use(chaiHttp);

const sandbox = sinon.createSandbox();

const serviceAccountKeyHeaders = {
  'X-Contentful-ServiceAccountKeyId': validServiceAccountKeyIdBase64,
};

describe('app', () => {
  let mockAdminClient: SinonStubbedInstance<AnalyticsAdminServiceClient>;
  let mockDataClient: SinonStubbedInstance<BetaAnalyticsDataClient>;

  beforeEach(() => {
    // TODO: set headers and fully test signature verification later
    sandbox.stub(NodeAppsToolkit, 'verifyRequest').get(() => {
      return () => true;
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('GET /health', () => {
    it('responds with 204', async () => {
      const response = await chai.request(app).get('/health');
      expect(response).to.have.status(204);
    });
  });

  describe('PUT /api/service_account_key_file', () => {
    describe('when the request body is a valid ServiceAccountKey', () => {
      describe('given a new ServiceAccountKey', () => {
        beforeEach(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (DynamoDBService.prototype.getServiceAccountKeyFile as any).resolves(null);
          sandbox.stub(DynamoDBService.prototype, 'saveServiceAccountKeyFile').resolves();
        });

        it('responds with 200', async () => {
          const response = await chai
            .request(app)
            .put('/api/service_account_key_file')
            .set(serviceAccountKeyHeaders)
            .set('X-Contentful-Space-Id', 'spaceId')
            .send(validServiceAccountKeyFile);
          expect(response).to.have.status(200);
        });
      });

      describe('given an existing ServiceAccountKey', () => {
        beforeEach(() => {
          sandbox.stub(DynamoDBService.prototype, 'saveServiceAccountKeyFile').resolves();
        });

        it('responds with 200', async () => {
          const response = await chai
            .request(app)
            .put('/api/service_account_key_file')
            .set(serviceAccountKeyHeaders)
            .set('X-Contentful-Space-Id', 'spaceId')
            .send(validServiceAccountKeyFile);
          expect(response).to.have.status(200);
        });
      });
    });
  });

  // TODO: These test need to be updated once we have everything configured
  describe('GET /api/account_summaries', () => {
    let googleApi: GoogleApiService;

    beforeEach(() => {
      mockAdminClient = mockAnalyticsAdminServiceClient();
      googleApi = new GoogleApiService(validServiceAccountKeyFile, mockAdminClient, mockDataClient);
      sandbox.stub(GoogleApiService, 'fromServiceAccountKeyFile').returns(googleApi);
    });

    it('responds with 200', async () => {
      const response = await chai
        .request(app)
        .get('/api/account_summaries')
        .set(serviceAccountKeyHeaders)
        .set('X-Contentful-Space-Id', 'spaceId');
      expect(response).to.have.status(200);
    });

    it('returns the expected response body', async () => {
      const response = await chai
        .request(app)
        .get('/api/account_summaries')
        .set(serviceAccountKeyHeaders)
        .set('X-Contentful-Space-Id', 'spaceId');
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
