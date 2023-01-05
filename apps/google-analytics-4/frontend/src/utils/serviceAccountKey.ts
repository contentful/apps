import { pick, reject } from 'lodash';
import type { ServiceAccountKey, ServiceAccountKeyId } from '../types';

export class AssertionError extends Error {}

const keysOfServiceAccountKey: Array<keyof ServiceAccountKey> = [
  'type',
  'project_id',
  'private_key_id',
  'private_key',
  'client_email',
  'client_id',
  'auth_uri',
  'token_uri',
  'auth_provider_x509_cert_url',
  'client_x509_cert_url',
];

function assertServiceAccountKey(value: any): asserts value is ServiceAccountKey {
  if (value?.type !== 'service_account') {
    throw new AssertionError("Key file `type` must be 'service_account'");
  }

  const missingKeys = reject(keysOfServiceAccountKey, (key) => key in value);
  if (missingKeys.length > 0) {
    throw new AssertionError(`Key file is missing the following keys: ${missingKeys.join(', ')}`);
  }

  const notStringValues = reject(keysOfServiceAccountKey, (key) => typeof value[key] === 'string');
  if (notStringValues.length > 0) {
    throw new AssertionError(
      `Key file has invalid values at the following keys: ${notStringValues.join(', ')}`
    );
  }
}

export const convertKeyFileToServiceAccountKey = (keyFile: string): ServiceAccountKey => {
  const parsedKeyFile = JSON.parse(keyFile);
  assertServiceAccountKey(parsedKeyFile);

  // ensure key file never contains extraneous keys
  return pick(parsedKeyFile, keysOfServiceAccountKey);
};

export const convertServiceAccountKeyToServiceAccountKeyId = (
  serviceAccountKey: ServiceAccountKey
): ServiceAccountKeyId => ({
  id: serviceAccountKey.private_key_id,
  clientEmail: serviceAccountKey.client_email,
  clientId: serviceAccountKey.client_id,
  projectId: serviceAccountKey.project_id,
});
