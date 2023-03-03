import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import app from '../app';
import {
  validServiceAccountKeyFileBase64,
  validServiceAccountKeyIdBase64,
} from '../../test/mocks/googleApi';

chai.use(chaiHttp);

const serviceAccountKeyHeaders = {
  'X-Contentful-ServiceAccountKeyId': validServiceAccountKeyIdBase64,
  'X-Contentful-ServiceAccountKey': validServiceAccountKeyFileBase64,
};

describe('verifySignedRequestMiddleware', () => {
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
