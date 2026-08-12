export type Provider = 's3' | 'azure' | 'gcs';

export interface ConfigFormState {
  provider: Provider;
  prefix: string;
  // s3
  bucketName: string;
  region: string;
  roleArn: string;
  externalId: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  // azure
  azureAccountName: string;
  azureContainerName: string;
  azureAccountKey: string;
  // gcs
  gcsBucketName: string;
  gcsServiceAccountKey: string;
}

export function emptyConfigForm(): ConfigFormState {
  return {
    provider: 's3',
    prefix: '',
    bucketName: '',
    region: '',
    roleArn: '',
    externalId: '',
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    azureAccountName: '',
    azureContainerName: '',
    azureAccountKey: '',
    gcsBucketName: '',
    gcsServiceAccountKey: '',
  };
}

const TEXT_FIELDS: Record<Provider, Array<keyof ConfigFormState>> = {
  s3: ['bucketName', 'region', 'roleArn', 'externalId'],
  azure: ['azureAccountName', 'azureContainerName'],
  gcs: ['gcsBucketName'],
};

export const SECRET_FIELDS: Record<Provider, Array<keyof ConfigFormState>> = {
  s3: ['awsAccessKeyId', 'awsSecretAccessKey'],
  azure: ['azureAccountKey'],
  gcs: ['gcsServiceAccountKey'],
};

const REQUIRED_TEXT: Record<Provider, Array<keyof ConfigFormState>> = {
  s3: ['bucketName', 'region'],
  azure: ['azureAccountName', 'azureContainerName'],
  gcs: ['gcsBucketName'],
};

/**
 * Emit `provider`, `prefix` and only the selected provider's fields.
 * Secrets read back from Contentful are redacted: send a typed value when the
 * installer entered one; otherwise re-send the stored (redacted) value so the
 * platform keeps the original; omit entirely when nothing was ever saved.
 */
export function buildParametersOnSave(
  form: ConfigFormState,
  saved: Record<string, unknown>
): Record<string, string> {
  const out: Record<string, string> = { provider: form.provider, prefix: form.prefix.trim() };
  for (const key of TEXT_FIELDS[form.provider]) out[key] = (form[key] as string).trim();
  for (const key of SECRET_FIELDS[form.provider]) {
    const typed = (form[key] as string).trim();
    if (typed) out[key] = typed;
    else if (typeof saved[key] === 'string' && saved[key] !== '') out[key] = saved[key] as string;
  }
  return out;
}

/** Names of the selected provider's required parameters that would be empty after this save. */
export function missingRequiredParameters(
  form: ConfigFormState,
  saved: Record<string, unknown>
): string[] {
  const out = buildParametersOnSave(form, saved);
  const missing: string[] = REQUIRED_TEXT[form.provider].filter((k) => !out[k]);
  for (const key of SECRET_FIELDS[form.provider]) if (!out[key]) missing.push(key);
  const typedGcsKey = form.provider === 'gcs' ? form.gcsServiceAccountKey.trim() : '';
  if (typedGcsKey) {
    let valid = false;
    try {
      const parsed = JSON.parse(typedGcsKey) as Record<string, unknown>;
      valid =
        typeof parsed.client_email === 'string' &&
        parsed.client_email.length > 0 &&
        typeof parsed.private_key === 'string' &&
        parsed.private_key.length > 0;
    } catch {
      valid = false;
    }
    if (!valid) {
      missing.push('gcsServiceAccountKey (invalid JSON — expected client_email and private_key)');
    }
  }
  return missing;
}

export const EGRESS_IPS = [
  '104.28.4.4/32',
  '104.28.4.5/32',
  '104.28.4.6/32',
  '104.28.4.7/32',
  '2a09:bac5:fff0:95::/64',
  '2a09:bac6:fff0:95::/64',
];
