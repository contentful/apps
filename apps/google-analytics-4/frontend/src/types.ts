import { IdsAPI } from '@contentful/app-sdk';

export interface AppInstallationParameters {
  serviceAccountKey: ServiceAccountKey | null;
  serviceAccountKeyId: ServiceAccountKeyId | null;
}

export interface ContentfulContext {
  app?: string;
  contentType?: string;
  entry?: string;
  environment: string;
  environmentAlias?: string;
  field?: string;
  location?: string;
  organization: string;
  space: string;
  user: string;
}

export interface ContentfulContextHeaders {
  'X-Contentful-App'?: string;
  'X-Contentful-ContentType'?: string;
  'X-Contentful-Entry'?: string;
  'X-Contentful-Environment'?: string;
  'X-Contentful-EnvironmentAlias'?: string;
  'X-Contentful-Field'?: string;
  'X-Contentful-Location'?: string;
  'X-Contentful-Organization'?: string;
  'X-Contentful-Space'?: string;
  'X-Contentful-User'?: string;
}

export interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export interface ServiceAccountKeyId {
  id: string;
  clientEmail: string;
  projectId: string;
  clientId: string;
}

export interface Row {
  dimensionValues: { value: string; oneValue: string }[];
  metricValues: { value: string; oneValue: string }[];
}

export interface RunReportResponse {
  dimensionHeaders: { name: string }[];
  metricHeaders: {
    name: string;
    type: string;
  }[];
  rows: Row[];
  totals: Row[];
  maximums: Row[];
  minimums: Row[];
  rowCount: number;
  metadata: {
    currencyCode: string;
    dataLossFromOtherRow: boolean;
    timeZone: string;
    _currencyCode: string;
    _timeZone: string;
  };
  propertyQuota: null;
  kind: string;
}

export type DateRangeType = 'lastWeek' | 'lastDay' | 'lastMonth';
