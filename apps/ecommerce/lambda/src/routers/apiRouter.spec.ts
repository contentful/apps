import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';
import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { mockResourceLink } from '../mocks/resourceLink.mock';
import nock, { RequestBodyMatcher } from 'nock';
import { ExternalResourceLink } from '../types';
import Sinon from 'sinon';
import { mockExternalResource } from '../mocks/resourceData.mock';

const BASE_URL = process.env.BASE_URL;

const sandbox = Sinon.createSandbox();
chai.use(chaiHttp);
chai.should();

function nockLocalRequest(body: nock.RequestBodyMatcher | ExternalResourceLink) {
  return nock(`${BASE_URL}`)
    .post(/shopify\/resource$/, <RequestBodyMatcher>body)
    .reply(200, mockExternalResource);
}

describe('API Controller', () => {
  beforeEach(() => {
    sandbox.stub(NodeAppsToolkit, 'verifyRequest').get(() => {
      return () => true;
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('When sending a ping', () => {
    it('should reply with a pong', (done) => {
      chai
        .request(app)
        .get('/api/ping')
        .set('X-Contentful-Data-Provider', 'shopify')
        .end((error, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  describe('When sending resource link data', () => {
    it('should return hydrated data when calling a resource', (done) => {
      nockLocalRequest(<ExternalResourceLink>mockResourceLink);

      chai
        .request(app)
        .post('/api/resource')
        .set('X-Contentful-Data-Provider', 'shopify')
        .send(mockResourceLink)
        .end((error, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.haveOwnProperty('description');
          done();
        });
    });
  });
});
