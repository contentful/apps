import chai, { expect } from 'chai';
import Express from 'express';
import sinon from 'sinon';
import { ApiError } from './api-error';
import { apiErrorMapper } from './api-error-mapper';
import { GoogleApiError } from '../services/google-api';

const next = sinon.stub();

const itMapsToApiError = (sourceError: Error, expectedApiError: Record<string, unknown>) => {
  describe('when a GoogleApiError is thrown', () => {
    it('returns a generic 500 error', async () => {
      apiErrorMapper(sourceError, {} as Express.Request, {} as Express.Response, next);
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
