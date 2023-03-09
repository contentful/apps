import { expect } from 'chai';
import sinon from 'sinon';
import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { createRequest } from 'node-mocks-http';
import Express from 'express';
import { verifySignedRequestMiddleware } from './verifySignedRequests';
import { InvalidSignature } from '../errors/invalidSignature';
import { UnableToVerifyRequest } from '../errors/unableToVerifyRequest';

const sandbox = sinon.createSandbox();

function buildSignedHeaders(method: any, path: string, headers: any, secret: string) {
  const timestamp = Date.now();
  const rawRequest = { method, path, headers };
  const signatureHeaders = NodeAppsToolkit.signRequest(secret, rawRequest, timestamp);
  return { ...headers, ...signatureHeaders };
}

describe('verifySignedRequestMiddleware', () => {
  const next = sinon.stub();
  const stage = 'testing';
  let request: Express.Request;
  const signingSecret = 'x'.repeat(64);
  const method = 'GET' as const;
  const path = '/foo/bar';

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
    sandbox.stub(process.env, 'STAGE').value(stage);
    sandbox.stub(process.env, 'SIGNING_SECRET').value(signingSecret);
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
      const invalidSignature = 's'.repeat(64);
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
      expect(() => {
        verifySignedRequestMiddleware(request, {} as Express.Response, next);
      }).to.throw(InvalidSignature);
    });
  });

  describe('when bad data is fed to verifier', () => {
    beforeEach(() => {
      const badSignature = 'foobar';
      const headers = buildSignedHeaders(
        method,
        clientRequestPath,
        clientRequestHeaders,
        signingSecret
      );
      const headersWithBadSignature = { ...headers, 'x-contentful-signature': badSignature };
      request = createRequest({ method, path, headers: headersWithBadSignature });
    });

    it('throws with UnableToVerifyRequest', async () => {
      expect(() => {
        verifySignedRequestMiddleware(request, {} as Express.Response, next);
      }).to.throw(UnableToVerifyRequest);
    });
  });
});
