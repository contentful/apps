import { IdsAPI } from '@contentful/app-sdk';

export interface AppInstallationParameters {
  serviceAccountKeyId: ServiceAccountKeyId;
  contentTypes?: ContentTypes;
  contentTypeRules?: ContentTypeRule[];
  propertyId: string;
  forceTrailingSlash: boolean;
}

// TODO: get this exported from the SDK
declare type EntryScopedIds = 'field' | 'entry' | 'contentType';

export interface ContentfulContext extends Omit<IdsAPI, EntryScopedIds> {
  app?: string;
  location?: string;
  // EntryScopedIds are not always present, but are conditionally when the location is entry field/sidebar/editor
  contentType?: string;
  entry?: string;
  field?: string;
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

export type GAMatchDimension = 'unifiedPagePathScreen' | 'pagePathPlusQueryString';
export type GAStringMatchType = 'EXACT' | 'PARTIAL_REGEXP';

export interface RunReportParamsType {
  propertyId: string;
  slug: string;
  matchDimension?: GAMatchDimension;
  matchType?: GAStringMatchType;
  startDate: string;
  endDate: string;
  dimensions: string | string[];
  metrics: string | string[];
}

export type DateRangeType =
  | 'lastDay'
  | 'lastWeek'
  | 'lastMonth'
  | 'lastQuarter'
  | 'lastYear'
  | 'custom';

export type AnalyticsMetricType = 'screenPageViews' | 'activeUsers';

export interface LocaleOption {
  code: string;
  label: string;
}

export interface StartEndDates {
  start: string;
  end: string;
}

export interface CustomRangeDialogInvocationParams {
  mode: 'customDateRange';
  startDate: string;
  endDate: string;
}

export interface CustomRangeDialogResult extends StartEndDates {}
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
  parent: string;
}

export interface ContentTypeValue {
  slugField: string;
  urlPrefix: string;
  additionalFieldIds?: string[];
  enableAdvancedMatching?: boolean;
  pathPattern?: string;
  matchDimension?: GAMatchDimension;
  matchType?: GAStringMatchType;
}

export interface ContentTypeRule extends ContentTypeValue {
  id: string;
  contentTypeId: string;
}

export interface ContentTypes {
  [key: string]: ContentTypeValue;
}

export type ContentTypeEntries = [string, ContentTypeValue][];
export type ContentTypeRules = ContentTypeRule[];

interface AllContentTypeValue {
  name: string;
  fields: {
    id: string;
    name: string;
    type: string;
  }[];
}

export interface AllContentTypes {
  [key: string]: AllContentTypeValue;
}

export type AllContentTypeEntries = [string, AllContentTypeValue][];

export interface EditorInterfaceAssignment {
  [key: string]: { [key: string]: { position: number } };
}

export type ConfigurationWarningTypes = '' | 'error' | 'warning';
