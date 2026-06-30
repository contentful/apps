import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon, { SinonStubbedInstance } from 'sinon';
import {
  mockAnalyticsAdminServiceClient,
  validServiceAccountKeyFile,
  validServiceAccountKeyIdBase64,
} from '../test/mocks/googleApi';
import app from './app';
import { config } from './config';
import { DynamoDBService } from './services/dynamoDbService';
import { GoogleApiService } from './services/googleApiService';

chai.use(chaiHttp);

const sandbox = sinon.createSandbox();

const signingSecret = 'x'.repeat(64);

// Headers the /api/* middleware expects on every signed request.
const contentfulHeaders: Record<string, string> = {
  'x-contentful-serviceaccountkeyid': validServiceAccountKeyIdBase64,
  'x-contentful-space-id': 'spaceId',
};

// Produce a genuinely-signed header set so requests pass verifySignedRequestMiddleware.
// node-apps-toolkit v4 exposes verifyRequest as a read-only binding, so it can no longer
// be stubbed in place — signing for real is both possible and more faithful to production.
const buildSignedHeaders = (
  method: NodeAppsToolkit.CanonicalRequest['method'],
  path: string,
  body?: string
): Record<string, string> => {
  const signatureHeaders = NodeAppsToolkit.signRequest(
    signingSecret,
    { method, path, headers: contentfulHeaders, body },
    Date.now()
  );
  return { ...contentfulHeaders, ...signatureHeaders };
};

describe('app', () => {
  let mockAdminClient: SinonStubbedInstance<AnalyticsAdminServiceClient>;
  let mockDataClient: SinonStubbedInstance<BetaAnalyticsDataClient>;

  beforeEach(() => {
    // stage 'test' makes the middleware sign the bare request path (no stage prefix)
    sandbox.stub(config, 'stage').value('test');
    sandbox.stub(config, 'signingSecret').value(signingSecret);
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
          sandbox.stub(DynamoDBService.prototype, 'saveServiceAccountKeyFile').resolves();
          sandbox
            .stub(DynamoDBService.prototype, 'getServiceAccountKeyFile')
            .resolves(validServiceAccountKeyFile);
        });

        it('responds with 200', async () => {
          const response = await chai
            .request(app)
            .put('/api/service_account_key_file')
            .set(
              buildSignedHeaders(
                'PUT',
                '/api/service_account_key_file',
                JSON.stringify(validServiceAccountKeyFile)
              )
            )
            .send(validServiceAccountKeyFile);
          expect(response).to.have.status(200);
        });
      });

      describe('given an existing ServiceAccountKey', () => {
        beforeEach(() => {
          sandbox.stub(DynamoDBService.prototype, 'saveServiceAccountKeyFile').resolves();
          sandbox
            .stub(DynamoDBService.prototype, 'getServiceAccountKeyFile')
            .resolves(validServiceAccountKeyFile);
        });
        it('responds with 200', async () => {
          const response = await chai
            .request(app)
            .put('/api/service_account_key_file')
            .set(
              buildSignedHeaders(
                'PUT',
                '/api/service_account_key_file',
                JSON.stringify(validServiceAccountKeyFile)
              )
            )
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
      sandbox.stub(DynamoDBService.prototype, 'saveServiceAccountKeyFile').resolves();
      sandbox
        .stub(DynamoDBService.prototype, 'getServiceAccountKeyFile')
        .resolves(validServiceAccountKeyFile);
    });

    it('responds with 200', async () => {
      const response = await chai
        .request(app)
        .get('/api/account_summaries')
        .set(buildSignedHeaders('GET', '/api/account_summaries'));
      expect(response).to.have.status(200);
    });

    it('returns the expected response body', async () => {
      const response = await chai
        .request(app)
        .get('/api/account_summaries')
        .set(buildSignedHeaders('GET', '/api/account_summaries'));
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
