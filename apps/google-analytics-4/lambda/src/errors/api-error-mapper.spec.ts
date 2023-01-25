import chai, { expect } from 'chai';
import Express from 'express';
import sinon from 'sinon';
import { ApiError } from './api-error';
import { apiErrorMapper } from './api-error-mapper';
import { GoogleApiError } from '../services/google-api';

const next = sinon.stub();

export class TestError extends Error {}

const apiErrorMap = {
  TestError: (e: Error) => new ApiError(e.message, e.constructor.name, 403, { foo: 'bar' }),
};

const itMapsToApiError = (sourceError: Error, expectedApiError: Record<string, unknown>) => {
  const apiErrorMapperHandler = apiErrorMapper(apiErrorMap);

  describe('when a GoogleApiError is thrown', () => {
    it('returns a generic 500 error', async () => {
      apiErrorMapperHandler(sourceError, {} as Express.Request, {} as Express.Response, next);
      sinon.assert.calledWith(next, sinon.match(expectedApiError));
    });
  });
};

describe('apiErrorMapper', () => {
  describe('when no error is passed', () => {
    it('does nothing', async () => {
      apiErrorMapper(undefined, {} as Express.Request, {} as Express.Response, next);
      sinon.assert.calledWith(next);
    });
  });

  itMapsToApiError(new GoogleApiError('boom!'), {
    errorType: 'Error',
  });
});
