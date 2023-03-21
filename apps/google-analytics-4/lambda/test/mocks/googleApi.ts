import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import sinon, { SinonStubbedInstance } from 'sinon';
import { ServiceAccountKeyFile, ServiceAccountKeyId } from '../../src/types';

const encodeObj = (obj: unknown) => {
  const jsonStr = JSON.stringify(obj);
  return Buffer.from(jsonStr).toString('base64');
};

export const validServiceAccountKeyFile: ServiceAccountKeyFile = {
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

export const validServiceAccountKeyId: ServiceAccountKeyId = {
  id: validServiceAccountKeyFile.private_key_id,
  clientId: validServiceAccountKeyFile.client_id,
  clientEmail: validServiceAccountKeyFile.client_id,
  projectId: validServiceAccountKeyFile.project_id,
};

export const validServiceAccountKeyIdBase64 = encodeObj(validServiceAccountKeyId);

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

// copied directly from runtime Google API error responses, which don't correctly map to the GoogleError type definition
export const mockGoogleErrors = {
  invalidAuthentication: {
    name: 'Error',
    message:
      '16 UNAUTHENTICATED: Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential. See https://developers.google.com/identity/sign-in/web/devconsole-project.',
    code: 16,
    details:
      'Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential. See https://developers.google.com/identity/sign-in/web/devconsole-project.',
    note: 'Exception occurred in retry method that was not classified as transient',
  },
  noApiAccess: {
    name: 'Error',
    message:
      '7 PERMISSION_DENIED: Google Analytics Admin API has not been used in project 265412335556 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=265412335556 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.',
    code: 7,
    details:
      'Google Analytics Admin API has not been used in project 265412335556 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=265412335556 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.',
    note: 'Exception occurred in retry method that was not classified as transient',
    metadata: {},
    statusDetails: [
      {
        links: [
          {
            description: 'Google developers console API activation',
            url: 'https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=265412335556',
          },
        ],
      },
      {
        reason: 'SERVICE_DISABLED',
        domain: 'googleapis.com',
        metadata: {
          consumer: 'projects/265412335556',
          service: 'analyticsadmin.googleapis.com',
        },
      },
    ],
    reason: 'SERVICE_DISABLED',
    domain: 'googleapis.com',
    errorInfoMetadata: {
      consumer: 'projects/265412335556',
      service: 'analyticsadmin.googleapis.com',
    },
  },
};

export const mockAnalyticsAdminServiceClient =
  (): SinonStubbedInstance<AnalyticsAdminServiceClient> => {
    const stubbedClient = sinon.createStubInstance(AnalyticsAdminServiceClient);
    stubbedClient.listAccountSummaries.resolves([[mockAccountSummary]]);
    return stubbedClient;
  };
