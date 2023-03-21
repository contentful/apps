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

  describe('when bad JSON is provided', () => {
    beforeEach(() => {
      testRequest = createRequest({
        headers: {
          'X-Contentful-ServiceAccountKeyId': 'Zm9vYmFy',
        },
      });
    });

    it('throws InvalidServiceAccountKey', () => {
      expect(() => {
        serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
      }).to.throw(InvalidServiceAccountKey);
    });
  });

  describe('when an improperly formed key is provided', () => {
    beforeEach(() => {
      testRequest = createRequest({
        headers: {
          'X-Contentful-ServiceAccountKeyId': 'eyJmb28iOiJiYXIifQ==',
        },
      });
    });

    it('throws InvalidServiceAccountKey', () => {
      expect(() => {
        serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
      }).to.throw(InvalidServiceAccountKey);
    });
  });

  describe('when no service account headers are provided', () => {
    beforeEach(() => {
      testRequest = createRequest({
        headers: {},
      });
    });

    it('sets the values top null', () => {
      expect(() => {
        serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
      }).to.throw(MissingServiceAccountKeyHeader);
    });
  });
});
