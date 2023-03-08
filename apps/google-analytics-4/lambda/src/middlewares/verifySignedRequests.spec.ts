import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import app from '../app';
import {
  validServiceAccountKeyFileBase64,
  validServiceAccountKeyIdBase64,
} from '../../test/mocks/googleApi';
import { createRequest } from 'node-mocks-http';
import Express from 'express';
import { verifySignedRequestMiddleware } from './verifySignedRequests';

chai.use(chaiHttp);

const sandbox = sinon.createSandbox();

const serviceAccountKeyHeaders = {
  'X-Contentful-ServiceAccountKeyId': validServiceAccountKeyIdBase64,
  'X-Contentful-ServiceAccountKey': validServiceAccountKeyFileBase64,
};

describe.only('verifySignedRequestMiddleware', () => {
  const next = sinon.stub();
  let request: Express.Request;
  const signingSecret = 'x'.repeat(64);

  beforeEach(() => {
    sandbox.stub(process.env, 'STAGE').value('test');
    sandbox.stub(process.env, 'SIGNING_SECRET').value(signingSecret);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('when request has valid signature', () => {
    const method = 'GET' as const;
    const rawPath = '/undefined/foo/bar';
    const path = '/foo/bar';
    const rawHeaders = {
      'x-contentful-signed-headers':
        'x-contentful-environment-id,x-contentful-signed-headers,x-contentful-space-id,x-contentful-timestamp,x-contentful-user-id,x-contentful-app-id',
      'x-contentful-user-id': 'user-id',
      'x-contentful-space-id': 'space-id',
      'x-contentful-environment-id': 'environment-id',
      'x-contentful-app-id': 'app-id',
    };

    beforeEach(() => {
      const timestamp = Date.now();
      const rawRequest = { method, path: rawPath, headers: rawHeaders };
      console.log('rawRequest', rawRequest);
      const signatureHeaders = NodeAppsToolkit.signRequest(signingSecret, rawRequest, timestamp);
      const headers = { ...rawHeaders, ...signatureHeaders };
      request = createRequest({ method, path, headers });
    });

    it('does nothing', async () => {
      verifySignedRequestMiddleware(request, {} as Express.Response, next);
      sinon.assert.calledWith(next);
    });
  });
});

describe('verifySignedRequestMiddleware2', () => {
  const verifyRequestStub = sinon.stub();

  beforeEach(() => {
    // TODO: set headers and fully test signature verification later
    sinon.stub(NodeAppsToolkit, 'verifyRequest').get(() => verifyRequestStub);
  });

  describe('given an unsigned request', () => {
    before(() => {
      verifyRequestStub.returns(false);
    });

    it('returns 403 Unauthorized', async () => {
      const response = await chai.request(app).get('/api/credentials');
      expect(response).to.have.status(403);
      expect(response.body.errors).to.have.property(
        'message',
        'Request does not have a valid request signature. See: https://www.contentful.com/developers/docs/extensibility/app-framework/request-verification/'
      );
    });
  });

  describe('given a signed request', () => {
    before(() => {
      verifyRequestStub.returns(true);
    });

    it('returns 200', async () => {
      const response = await chai
        .request(app)
        .get('/api/credentials')
        .set(serviceAccountKeyHeaders);
      expect(response).to.have.status(200);
      expect(response.body).to.have.property('status', 'active');
    });
  });
});
