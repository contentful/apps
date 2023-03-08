import express from 'express';
import Express from 'express';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import { apiErrorHandler, ApiErrorMap, apiErrorMapper } from './apiErrorHandler';
import { ApiError } from '../errors/apiError';

describe('apiErrorHandler', () => {
  chai.use(chaiHttp);

  const maybeThrow = sinon.stub();

  const app = express();
  app.get('/test', (_req, res) => {
    maybeThrow();
    res.status(204).send();
  });
  app.use(apiErrorHandler);

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
      expect(response.body.errors).to.have.property('errorType', 'ServerError');
      expect(response.body.errors).to.have.property('message', 'Internal Server Error');
      expect(response.body.errors).to.have.property('details');
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
      expect(response.body.errors).to.have.property('errorType', 'MyError');
      expect(response.body.errors).to.have.property('message', 'boom!');
      expect(response.body.errors.details).to.have.property('foo', 'bar');
    });
  });
});

describe('apiErrorMapper', () => {
  const next = sinon.stub();

  class TestError extends Error {
    foo: string;

    constructor(message: string, foo: string) {
      super(message);
      this.foo = foo;
    }
  }
  const apiErrorMap: ApiErrorMap = {
    TestError: (e: TestError) => new ApiError(e.message, e.constructor.name, 403, { foo: e.foo }),
  };
  const apiErrorMapperHandler = apiErrorMapper(apiErrorMap);

  describe('when no error is passed', () => {
    it('does nothing', async () => {
      apiErrorMapperHandler(undefined, {} as Express.Request, {} as Express.Response, next);
      sinon.assert.calledWith(next);
    });
  });

  describe('when an error that is mapped is thrown', () => {
    it('returns a generic 500 error', async () => {
      apiErrorMapperHandler(
        new TestError('boom!', 'bar'),
        {} as Express.Request,
        {} as Express.Response,
        next
      );
      sinon.assert.calledWith(
        next,
        sinon.match({
          message: 'boom!',
          status: 403,
        })
      );
    });
  });

  describe('when an error that is not mapped is thrown', () => {
    it('returns a generic 500 error', async () => {
      const thrownError = new TypeError('boom!');
      apiErrorMapperHandler(thrownError, {} as Express.Request, {} as Express.Response, next);
      sinon.assert.calledWith(next, thrownError);
    });
  });
});
