import express from 'express';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { errorMiddleware } from './middleware';
import { ApiError } from './api-error';

chai.use(chaiHttp);

const maybeThrow = sinon.stub();

const app = express();
app.get('/test', (_req, res) => {
  maybeThrow();
  res.status(204).send();
});
app.use(errorMiddleware);

describe('errorMiddleware', () => {
  describe('when no error raised', () => {
    it('does nothing', async () => {
      const response = await chai.request(app).get('/test');
      expect(response).to.have.status(204);
    });
  });

  describe('when an aribitrary error is thrown', () => {
    beforeEach(() => {
      maybeThrow.callsFake(() => {
        throw new Error('boom!');
      });
    });

    it('returns a generic 500 error', async () => {
      const response = await chai.request(app).get('/test');
      expect(response).to.have.status(500);
      expect(response.body).to.have.property('errorType', 'ServerError');
      expect(response.body).to.have.property('message', 'Internal Server Error');
      expect(response.body).to.have.property('details');
    });
  });

  describe('when an ApiError is thrown', () => {
    beforeEach(() => {
      maybeThrow.callsFake(() => {
        throw new ApiError('boom!', 'MyError', 403, { foo: 'bar' });
      });
    });

    it('returns an error with the same status code and properties', async () => {
      const response = await chai.request(app).get('/test');
      expect(response).to.have.status(403);
      expect(response.body).to.have.property('errorType', 'MyError');
      expect(response.body).to.have.property('message', 'boom!');
      expect(response.body.details).to.have.property('foo', 'bar');
    });
  });
});
