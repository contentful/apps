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

export interface ContentTypeMappingType {
  contentType: ContentTypeProps,
  field: ContentFields,
  urlPrefix: string
}
