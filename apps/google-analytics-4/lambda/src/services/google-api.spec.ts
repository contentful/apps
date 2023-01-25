import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { expect } from 'chai';
import { Status } from 'google-gax';
import { SinonStubbedInstance } from 'sinon';
import {
  mockAccountSummary,
  mockAnalyticsAdminServiceClient,
  mockGoogleErrors,
  validServiceAccountKeyFile,
} from '../../test/mocks/googleApi';
import {
  GoogleApi,
  GoogleApiClientError,
  GoogleApiError,
  GoogleApiServerError,
  throwGoogleApiError,
} from './google-api';

describe('GoogleApi', () => {
  let googleApi: GoogleApi;
  let mockClient: SinonStubbedInstance<AnalyticsAdminServiceClient>;

  beforeEach(() => {
    mockClient = mockAnalyticsAdminServiceClient();
    googleApi = new GoogleApi(validServiceAccountKeyFile, mockClient);
  });

  describe('listAccountSummaries', () => {
    it('returns a list of AccountSummary objects', async () => {
      const result = await googleApi.listAccountSummaries();
      expect(result).to.include(mockAccountSummary);
    });
  });

  describe('when a regular error is thrown during the API call', () => {
    const someError = new Error('boom!');

    beforeEach(() => {
      mockClient = mockAnalyticsAdminServiceClient();
      mockClient.listAccountSummaries.rejects(someError);
      googleApi = new GoogleApi(validServiceAccountKeyFile, mockClient);
    });

    it('throws a GoogleApiServerError', async () => {
      let error: Error | undefined = undefined;
      try {
        await googleApi.listAccountSummaries();
      } catch (e) {
        error = e as Error;
      }
      expect(error).to.be.an.instanceof(GoogleApiError);
      expect(error?.cause).to.equal(someError);
    });
  });
});

describe('throwGoogleApiError', () => {
  describe('when passed a regular error', () => {
    const someError = new Error('boom!');

    it('throws a GoogleApiError', async () => {
      let error: Error | undefined = undefined;
      try {
        throwGoogleApiError(someError);
      } catch (e) {
        error = e as Error;
      }
      expect(error).to.be.an.instanceof(GoogleApiError);
      expect(error?.cause).to.equal(someError);
    });
  });

  describe('when passed a GoogleError server error', () => {
    const someError = {
      name: 'Error',
      message: 'Some server error',
      code: Status.UNAVAILABLE,
      details: 'Some server error',
    };

    it('throws a GoogleApiServerError', async () => {
      let error: Error | undefined = undefined;
      try {
        throwGoogleApiError(someError);
      } catch (e) {
        error = e as Error;
      }
      expect(error).to.be.an.instanceof(GoogleApiServerError);
      expect(error).to.have.property('cause', someError);
      expect(error).to.have.property('code', 'UNAVAILABLE');
      expect(error).to.have.property('details', someError.details);
    });
  });

  describe('when passed a GoogleError with unauthenticated code', () => {
    const someError = mockGoogleErrors.invalidAuthentication;

    it('throws a GoogleApiClientError', async () => {
      let error: Error | undefined = undefined;
      try {
        throwGoogleApiError(someError);
      } catch (e) {
        error = e as Error;
      }
      expect(error).to.be.an.instanceof(GoogleApiClientError);
      expect(error).to.have.property('cause', someError);
      expect(error).to.have.property('code', 'UNAUTHENTICATED');
      expect(error).to.have.property('details', mockGoogleErrors.invalidAuthentication.details);
    });
  });
});
