import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';
import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { mockResourceLink } from '../mocks/resourceLink.mock';
import nock, { RequestBodyMatcher } from 'nock';
import { mockCombinedResource } from '../mocks/combinedResource.mock';
import { ResourceLink } from '../types';
import Sinon from 'sinon';

const BASE_URL = process.env.BASE_URL;

const sandbox = Sinon.createSandbox();
chai.use(chaiHttp);
chai.should();

function nockLocalRequest(body: nock.RequestBodyMatcher | ResourceLink) {
  return nock(`${BASE_URL}`)
    .post(/shopify\/resource$/, <RequestBodyMatcher>body)
    .reply(200, mockCombinedResource);
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
      nockLocalRequest(<ResourceLink>mockResourceLink);

      chai
        .request(app)
        .post('/api/resource/product')
        .set('X-Contentful-Data-Provider', 'shopify')
        .send(mockResourceLink)
        .end((error, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.haveOwnProperty('description');
          done();
        });
    });

    it('should throw an error when no provider is provided', (done) => {
      const { provider, ...newResourceLink } = mockResourceLink.sys; // eslint-disable-line @typescript-eslint/no-unused-vars

      chai
        .request(app)
        .post('/api/resource/product')
        .set('X-Contentful-Data-Provider', 'shopify')
        .send({ sys: newResourceLink })
        .end((error, res) => {
          expect(res).to.have.status(500);
          done();
        });
    });
  });
});
