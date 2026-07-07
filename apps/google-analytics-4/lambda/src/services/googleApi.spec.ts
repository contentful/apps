import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { expect } from 'chai';
import { Status } from 'google-gax';
import sinon, { SinonStubbedInstance } from 'sinon';
import {
  mockAccountSummary,
  mockAnalyticsAdminServiceClient,
  mockGoogleErrors,
  validServiceAccountKeyFile,
} from '../../test/mocks/googleApi';
import { GoogleApiError, handleGoogleAdminApiError } from './googleApiUtils';
import { GoogleApiService } from './googleApiService';
import { ERROR_TYPE_MAP } from '../errors/apiError';

describe('GoogleApiService', () => {
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

    it('throws a the regular error', async () => {
      let error: Error | undefined = undefined;
      try {
        await googleApi.listAccountSummaries();
      } catch (e) {
        error = e as Error;
      }
      expect(error).to.eq(someError);
    });
  });

  describe('runReport', () => {
    let runReportSpy: sinon.SinonSpy;

    beforeEach(() => {
      runReportSpy = sinon.spy(() =>
        Promise.resolve([
          {
            rows: [],
          },
        ])
      );
      mockDataClient = {
        runReport: runReportSpy,
      } as unknown as SinonStubbedInstance<BetaAnalyticsDataClient>;
      googleApi = new GoogleApiService(validServiceAccountKeyFile, mockAdminClient, mockDataClient);
    });

    it('uses the requested GA4 match dimension in the filter', async () => {
      await googleApi.runReport(
        'properties/123',
        '/article?articleId=360054483454',
        'pagePathPlusQueryString',
        'PARTIAL_REGEXP',
        '2026-04-01',
        '2026-04-06'
      );

      expect(runReportSpy.firstCall.args[0].dimensionFilter.filter.fieldName).to.equal(
        'pagePathPlusQueryString'
      );
      expect(runReportSpy.firstCall.args[0].dimensionFilter.filter.stringFilter.matchType).to.equal(
        'PARTIAL_REGEXP'
      );
    });
  });
});

describe('throwGoogleApiError', () => {
  describe('when passed a GoogleError server error', () => {
    const someError = {
      name: 'Error',
      message: 'Some server error',
      code: Status.UNAVAILABLE,
      details: 'Some server error',
    };

    it('throws a GoogleApiError', async () => {
      let error: Error;
      try {
        handleGoogleAdminApiError(someError);
      } catch (e) {
        error = e as Error;
      }
      expect(error).to.be.an.instanceof(GoogleApiError);
      expect(error).to.have.property('cause', someError);
      expect(error).to.have.property('errorType', ERROR_TYPE_MAP.unknown);
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
      expect(error).to.have.property('errorType', ERROR_TYPE_MAP.invalidServiceAccount);
      expect(error).to.have.property('details', mockGoogleErrors.invalidAuthentication.message);
    });
  });
});
