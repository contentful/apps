import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { expect } from 'chai';
import { Status } from 'google-gax';
import { SinonStubbedInstance } from 'sinon';
import {
  mockAccountSummary,
  mockAnalyticsAdminServiceClient,
  mockGoogleErrors,
  validServiceAccountKeyFile,
} from '../../test/mocks/googleApi';
import { GoogleApiError, handleGoogleAdminApiError } from './googleApiUtils';
import { GoogleApiService } from './googleApiService';

describe('GoogleApi', () => {
  let googleApi: GoogleApiService;
  let mockAdminClient: SinonStubbedInstance<AnalyticsAdminServiceClient>;
  let mockDataClient: SinonStubbedInstance<BetaAnalyticsDataClient>;

  beforeEach(() => {
    mockAdminClient = mockAnalyticsAdminServiceClient();
    googleApi = new GoogleApiService(validServiceAccountKeyFile, mockAdminClient, mockDataClient);
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
      mockAdminClient = mockAnalyticsAdminServiceClient();
      mockAdminClient.listAccountSummaries.rejects(someError);
      googleApi = new GoogleApiService(validServiceAccountKeyFile, mockAdminClient, mockDataClient);
    });

    it('throws a GoogleApiError', async () => {
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
        handleGoogleAdminApiError(someError);
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

    it('throws a GoogleApiError', async () => {
      let error: Error | undefined = undefined;
      try {
        handleGoogleAdminApiError(someError);
      } catch (e) {
        error = e as Error;
      }
      expect(error).to.be.an.instanceof(GoogleApiError);
      expect(error).to.have.property('cause', someError);
      expect(error).to.have.property('code', Status.UNAVAILABLE);
      expect(error).to.have.property('details', someError.details);
    });
  });

  describe('when passed a GoogleError with unauthenticated code', () => {
    const someError = mockGoogleErrors.invalidAuthentication;

    it('throws a GoogleApiError', async () => {
      let error: Error | undefined = undefined;
      try {
        handleGoogleAdminApiError(someError);
      } catch (e) {
        error = e as Error;
      }
      expect(error).to.be.an.instanceof(GoogleApiError);
      expect(error).to.have.property('cause', someError);
      expect(error).to.have.property('code', Status.UNAUTHENTICATED);
      expect(error).to.have.property('details', mockGoogleErrors.invalidAuthentication.details);
    });
  });
});
