import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from './app';

chai.use(chaiHttp);

describe('app', () => {
  describe('GET /health', () => {
    it('responds with 200', async () => {
      const response = await chai.request(app).get('/health');
      expect(response).to.have.status(200);
    });
  });
});
