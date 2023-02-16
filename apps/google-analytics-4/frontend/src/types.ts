import { ContentTypeProps, ContentFields } from "contentful-management";

export interface AppInstallationParameters {
  serviceAccountKey: ServiceAccountKey;
  serviceAccountKeyId: ServiceAccountKeyId;
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
export interface AccountSummariesType {
  displayName: string;
  name: string;
  account: string;
  propertySummaries: PropertySummariesType[];
}

export interface PropertySummariesType {
  displayName: string;
  property: string;
  propertyType: string;
}
