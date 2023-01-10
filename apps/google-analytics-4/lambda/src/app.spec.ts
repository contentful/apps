import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from './app';

chai.use(chaiHttp);

describe('app', () => {
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
});
