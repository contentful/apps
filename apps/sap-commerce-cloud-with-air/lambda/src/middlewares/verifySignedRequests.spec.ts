import sinon from 'sinon';
import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { createRequest } from 'node-mocks-http';
import Express from 'express';
import { verifySignedRequestMiddleware } from './verifySignedRequests';
import { config } from '../config';

const sandbox = sinon.createSandbox();

function buildSignedHeaders(
  method: NodeAppsToolkit.CanonicalRequest['method'],
  path: string,
  headers: NodeAppsToolkit.CanonicalRequest['headers'],
  secret: string
) {
  const timestamp = Date.now();
  const rawRequest = { method, path, headers };
  const signatureHeaders = NodeAppsToolkit.signRequest(secret, rawRequest, timestamp);
  return { ...headers, ...signatureHeaders };
}

describe('verifySignedRequestMiddleware', () => {
  const next = sinon.stub();
  const stage = 'testing';
  let request: Express.Request;
  const method = 'GET' as const;
  const path = '/foo/bar';
  const signingSecret = 'super-secret';

  // when a stage is involved, the "request" path will include that stage in the client but it will be missing
  // on the express request in the backend
  const clientRequestPath = `/${stage}${path}`;
  const clientRequestHeaders = {
    'x-contentful-signed-headers':
      'x-contentful-environment-id,x-contentful-signed-headers,x-contentful-space-id,x-contentful-timestamp,x-contentful-user-id,x-contentful-app-id',
    'x-contentful-user-id': 'user-id',
    'x-contentful-space-id': 'space-id',
    'x-contentful-environment-id': 'environment-id',
    'x-contentful-app-id': 'app-id',
  };

  beforeEach(() => {
    sandbox.stub(config, 'stage').value(stage);
    const headers = buildSignedHeaders(
      method,
      clientRequestPath,
      clientRequestHeaders,
      signingSecret
    );
    request = createRequest({ method, path, headers });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('when request has valid signature', () => {
    it('continues with the request', async () => {
      verifySignedRequestMiddleware(request, {} as Express.Response, next);
      sinon.assert.calledWith(next);
    });
  });

  describe('when request has an invalid signature', () => {
    beforeEach(() => {
      const invalidSignature = 'x'.repeat(64);
      const headers = buildSignedHeaders(
        method,
        clientRequestPath,
        clientRequestHeaders,
        signingSecret
      );
      const headersWithInvalidSignature = {
        ...headers,
        'x-contentful-signature': invalidSignature,
      };
      request = createRequest({ method, path, headers: headersWithInvalidSignature });
    });

    it('throws with invalidSignature', async () => {
      verifySignedRequestMiddleware(request, {} as Express.Response, next);
      sinon.assert.calledWith(
        next,
        sinon.match({
          message:
            'Request does not have a valid request signature. ' +
            'See: https://www.contentful.com/developers/docs/extensibility/app-framework/request-verification/',
        })
      );
    });
  });

  describe('when a signature that fails verification is provided', () => {
    beforeEach(() => {
      const malformedSignature = 'invalid-signature-format';
      const headers = buildSignedHeaders(
        method,
        clientRequestPath,
        clientRequestHeaders,
        signingSecret
      );
      const headersWithBadSignature = { ...headers, 'x-contentful-signature': malformedSignature };
      request = createRequest({ method, path, headers: headersWithBadSignature });
    });

    it('throws with UnableToVerifyRequest', async () => {
      verifySignedRequestMiddleware(request, {} as Express.Response, next);
      sinon.assert.calledWith(
        next,
        sinon.match({
          message: 'Unable to verify request',
        })
      );
    });
  });
});
