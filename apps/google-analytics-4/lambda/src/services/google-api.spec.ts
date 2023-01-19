import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { expect } from 'chai';
import { SinonStubbedInstance } from 'sinon';
import {
  mockAccountSummary,
  mockAnalyticsAdminServiceClient,
  validServiceAccountKeyFile,
} from '../../test/mocks/googleApi';
import { GoogleApi, GoogleApiServerError } from './google-api';

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

  describe('when an error is thrown during the API call', () => {
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
      expect(error).to.be.an.instanceof(GoogleApiServerError);
      expect(error!.cause).to.equal(someError);
    });
  });
});
