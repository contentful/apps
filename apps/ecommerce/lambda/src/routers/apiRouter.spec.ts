import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';
import { mockResourceLink } from '../mocks/resourceLink.mock';
import nock, { RequestBodyMatcher } from 'nock';
import { mockCombinedResource } from '../mocks/combinedResource.mock';
import { ResourceLink } from '../types';

const BASE_URL = process.env.BASE_URL;

chai.use(chaiHttp);
chai.should();

function nockLocalRequest(body: nock.RequestBodyMatcher | ResourceLink) {
  return nock(`${BASE_URL}`)
    .post(/shopify\/resource$/, <RequestBodyMatcher>body)
    .reply(200, mockCombinedResource);
}

describe('API Controller', () => {
  describe('When sending a ping', () => {
    it('should reply with a pong', (done) => {
      chai
        .request(app)
        .get('/ping')
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
        .post('/resource/product')
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
        .post('/resource/product')
        .send({ sys: newResourceLink })
        .end((error, res) => {
          expect(res).to.have.status(500);
          done();
        });
    });
  });
});
