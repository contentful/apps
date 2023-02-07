import Express from 'express';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  InvalidServiceAccountKey,
  MissingServiceAccountKeyHeader,
  serviceAccountKeyProvider,
} from './service-account-key-provider';
import {
  validServiceAccountKeyFile,
  validServiceAccountKeyFileBase64,
  validServiceAccountKeyId,
  validServiceAccountKeyIdBase64,
} from '../../test/mocks/googleApi';

describe('apiErrorMapper', () => {
  const next = sinon.stub();
  let testRequest: Express.Request;

  beforeEach(() => {
    testRequest = {
      headers: {
        'x-contentful-serviceaccountkeyid': validServiceAccountKeyIdBase64,
        'x-contentful-serviceaccountkey': validServiceAccountKeyFileBase64,
      },
    } as unknown as Express.Request;
  });

  it('sets the service account properties on the request object', () => {
    serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
    expect(testRequest.serviceAccountKey).to.have.property(
      'private_key',
      validServiceAccountKeyFile.private_key
    );
    expect(testRequest.serviceAccountKeyId).to.have.property('id', validServiceAccountKeyId.id);
  });

  describe('when bad JSON is provided', () => {
    beforeEach(() => {
      testRequest.headers = {
        'x-contentful-serviceaccountkeyid': 'Zm9vYmFy',
        'x-contentful-serviceaccountkey': 'Zm9vYmFy',
      };
    });

    it('throws InvalidServiceAccountKey', () => {
      expect(() => {
        serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
      }).to.throw(InvalidServiceAccountKey);
    });
  });

  describe('when an improperly formed key is provided', () => {
    beforeEach(() => {
      testRequest.headers = {
        'x-contentful-serviceaccountkeyid': 'eyJmb28iOiJiYXIifQ==',
        'x-contentful-serviceaccountkey': 'eyJmb28iOiJiYXIifQ==',
      };
    });

    it('throws InvalidServiceAccountKey', () => {
      expect(() => {
        serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
      }).to.throw(InvalidServiceAccountKey);
    });
  });

  describe('when no service account headers are provided', () => {
    beforeEach(() => {
      testRequest.headers = {};
    });

    it('sets the values top null', () => {
      expect(() => {
        serviceAccountKeyProvider(testRequest, {} as Express.Response, next);
      }).to.throw(MissingServiceAccountKeyHeader);
    });
  });
});
