import Express from 'express';
import sinon from 'sinon';
import { ApiError } from './api-error';
import { ApiErrorMap, apiErrorMapper } from './api-error-mapper';

const next = sinon.stub();

export class TestError extends Error {
  foo: string;

  constructor(message: string, foo: string) {
    super(message);
    this.foo = foo;
  }
}
const apiErrorMap: ApiErrorMap = {
  TestError: (e: TestError) => new ApiError(e.message, e.constructor.name, 403, { foo: e.foo }),
};

describe('apiErrorMapper', () => {
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
