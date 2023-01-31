import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';
import sinon from 'sinon';

chai.use(chaiHttp);

describe('verifySignedRequestMiddleware', () => {
  // to make this integration request, these header values were captured
  const signature = '23b4145cf37d48030cb2818d3edbd2086f2566dcbf22c79bfbead3301fd4562a';
  const timestamp = '1675203823305';
  const spaceId = '30x8uoqewkkz';
  const environmentId = 'master';
  const userId = '6iUaAfJg2ZoKe4oEYF7kxe';

  beforeEach(() => {
    process.env.STAGE = 'dev'; // don't change this without recomputing the signed request signature
    process.env.SIGNING_SECRET = 'mFjgMwlcE5iHKl855rGk9adWTP9ZagSamQctAElpptMtpGQmNIuGoRWOZZ_lhU_4';
    sinon.useFakeTimers(parseInt(timestamp));
  });

  describe('given a signed request with valid signature', () => {
    it('returns 200', async () => {
      const response = await chai
        .request(app)
        .get('/api/credentials')
        .set('x-contentful-signature', signature)
        .set(
          'x-contentful-signed-headers',
          ' x-contentful-environment-id,x-contentful-signed-headers,x-contentful-space-id,x-contentful-timestamp,x-contentful-user-id'
        )
        .set('x-contentful-timestamp', timestamp)
        .set('x-contentful-space-id', spaceId)
        .set('x-contentful-environment-id', environmentId)
        .set('x-contentful-user-id', userId);
      expect(response).to.have.status(200);
      expect(response.body).to.have.property('status', 'active');
    });
  });

  describe('given an signed request with an invalid signature', () => {
    const invalidSignature = '12a3456bc37d48030cb2818d3edbd2086f2566dcbf22c79bfbead3301fd4562z';

    it('returns 403 Unauthorized', async () => {
      const response = await chai
        .request(app)
        .get('/api/credentials')
        .set('x-contentful-signature', invalidSignature)
        .set(
          'x-contentful-signed-headers',
          ' x-contentful-environment-id,x-contentful-signed-headers,x-contentful-space-id,x-contentful-timestamp,x-contentful-user-id'
        )
        .set('x-contentful-timestamp', timestamp)
        .set('x-contentful-space-id', spaceId)
        .set('x-contentful-environment-id', environmentId)
        .set('x-contentful-user-id', userId);
      expect(response).to.have.status(403);
      expect(response.body).to.have.property(
        'message',
        'Request does not have a valid request signature. See: https://www.contentful.com/developers/docs/extensibility/app-framework/request-verification/'
      );
    });
  });

  describe('given an unsigned request', () => {
    it('returns 422 Bad Request', async () => {
      const response = await chai.request(app).get('/api/credentials');
      expect(response).to.have.status(422);
      expect(response.body).to.have.property('message', 'Unable to verify request');
    });
  });
});
