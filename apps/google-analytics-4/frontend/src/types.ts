export interface AppInstallationParameters {
  serviceAccountKey: ServiceAccountKey | null;
  serviceAccountKeyId: ServiceAccountKeyId | null;
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
