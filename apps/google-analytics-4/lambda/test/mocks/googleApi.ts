import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import sinon, { SinonStubbedInstance } from 'sinon';

export const validServiceAccountKeyFile = {
  type: 'service_account',
  project_id: 'mock-project-id',
  private_key_id: 'mock-private-key-id',
  private_key: 'mock-private-key',
  client_email: 'mock-client-email@mock-project-id.iam.gserviceaccount.com',
  client_id: '123456789',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/mock-client-email%40mock-project-id.iam.gserviceaccount.com',
};

export const mockAccountSummary = {
  propertySummaries: [
    {
      property: 'properties/34567890',
      displayName: 'Property 2',
      propertyType: 'PROPERTY_TYPE_ORDINARY',
      parent: 'accounts/12345678',
    },
    {
      property: 'properties/23456789',
      displayName: 'Property 2',
      propertyType: 'PROPERTY_TYPE_ORDINARY',
      parent: 'accounts/12345678',
    },
  ],
  name: 'accountSummaries/12345678',
  account: 'accounts/12345678',
  displayName: 'Account',
};

export const mockAnalyticsAdminServiceClient =
  (): SinonStubbedInstance<AnalyticsAdminServiceClient> => {
    const stubbedClient = sinon.createStubInstance(AnalyticsAdminServiceClient);
    stubbedClient.listAccountSummaries.resolves([[mockAccountSummary]]);
    return stubbedClient;
  };
