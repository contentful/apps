import { RequestHandler } from 'express';
import { SinonStub, stub } from 'sinon';
import { assert, mockRequest, mockResponse } from '../../../test/utils';
import { NotFoundException } from '../../errors';
import { createContentfulRequestVerificationMiddleware } from './contentful-request-verification';

describe('createContentfulRequestVerificationMiddleware', () => {
  let handler: RequestHandler;
  let verifier: SinonStub;

  beforeEach(() => {
    verifier = stub();

    handler = createContentfulRequestVerificationMiddleware('secret', verifier);
  });

  it('throws a NotFoundException for non-verified requests', async () => {
    verifier.returns(false);

    const request = mockRequest({
      body: Buffer.alloc(0),
      headers: {
        ['x-contentful-space-id']: 'space',
        ['x-contentful-environment-id']: 'env',
      },
    });
    const next = stub();

    assert.throws(() => handler(request, mockResponse(), next), NotFoundException);
    assert.notCalled(next);
  });

  it('calls `next` for verified requests', async () => {
    verifier.returns(true);

    const request = mockRequest({
      body: Buffer.alloc(0),
      headers: {
        ['x-contentful-space-id']: 'space',
        ['x-contentful-environment-id']: 'env',
      },
    });
    const next = stub();

    handler(request, mockResponse(), next);
    assert.calledOnce(next);
  });
});
