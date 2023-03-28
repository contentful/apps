import Express from 'express';
import { expect } from 'chai';
import { createRequest } from 'node-mocks-http';
import sinon from 'sinon';
import {
  InvalidServiceAccountKey,
  MissingServiceAccountKeyHeader,
  serviceAccountKeyProvider,
} from './serviceAccountKeyProvider';
import {
  validServiceAccountKeyId,
  validServiceAccountKeyIdBase64,
} from '../../test/mocks/googleApi';

describe('serviceAccountKeyProvider', () => {
  const next = sinon.stub();
  let testRequest: Express.Request;

  beforeEach(() => {
    testRequest = createRequest({
      headers: {
        'X-Contentful-ServiceAccountKeyId': validServiceAccountKeyIdBase64,
      },
    });
  });

  it('sets the service account properties on the request object', () => {
    serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
    expect(testRequest.serviceAccountKeyId).to.have.property('id', validServiceAccountKeyId.id);
  });

  describe('when bad [encoded] JSON is provided', () => {
    beforeEach(() => {
      testRequest = createRequest({
        headers: {
          'X-Contentful-ServiceAccountKeyId': 'bm90IGpzb24=', // base64 encoded 'not json'
        },
      });
    });

    it('throws InvalidServiceAccountKey', () => {
      serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
      sinon.assert.calledWith(next, sinon.match.instanceOf(InvalidServiceAccountKey));
    });
  });

  describe('when valid JSON, but invalid service key ID is provided', () => {
    beforeEach(() => {
      testRequest = createRequest({
        headers: {
          'X-Contentful-ServiceAccountKeyId': 'eyJmb28iOiJiYXIifQ==', // base64 encoded '{"foo":"bar"}'
        },
      });
    });

    it('throws InvalidServiceAccountKey', () => {
      serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
      sinon.assert.calledWith(next, sinon.match.instanceOf(InvalidServiceAccountKey));
    });
  });

  describe('when no service account headers are provided', () => {
    beforeEach(() => {
      testRequest = createRequest({
        headers: {},
      });
    });

    it('throws MissingServiceAccountKeyHeader', () => {
      serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
      sinon.assert.calledWith(next, sinon.match.instanceOf(MissingServiceAccountKeyHeader));
    });
  });
});
