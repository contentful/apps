import { ServiceAccountKey, ServiceAccountKeyId } from '../../src/types';

export { mockCma } from './mockCma';
export { mockSdk } from './mockSdk';

export const validServiceKeyFile: ServiceAccountKey = {
  type: 'service_account',
  project_id: 'PROJECT_ID',
  private_key_id: 'PRIVATE_KEY_ID',
  private_key: '----- PRIVATE_KEY-----',
  client_email: 'example4@PROJECT_ID.iam.gserviceaccount.com',
  client_id: 'CLIENT_ID',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/example4%40PROJECT_ID.iam.gserviceaccount.com',
};

export const validServiceKeyId: ServiceAccountKeyId = {
  id: validServiceKeyFile.private_key_id,
  clientId: validServiceKeyFile.client_id,
  clientEmail: validServiceKeyFile.client_id,
  projectId: validServiceKeyFile.project_id,
};
