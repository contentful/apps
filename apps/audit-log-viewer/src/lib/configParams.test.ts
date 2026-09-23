// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildParametersOnSave,
  EGRESS_IPS,
  emptyConfigForm,
  missingRequiredParameters,
  type ConfigFormState,
} from './configParams';

const s3Form = (): ConfigFormState => ({
  ...emptyConfigForm(),
  provider: 's3',
  bucketName: 'my-bucket',
  region: 'eu-west-1',
});

describe('buildParametersOnSave', () => {
  it('always includes provider and only the selected provider fields', () => {
    const out = buildParametersOnSave({ ...s3Form(), azureAccountName: 'should-not-leak' }, {});
    expect(out.provider).toBe('s3');
    expect(out.bucketName).toBe('my-bucket');
    expect(out).not.toHaveProperty('azureAccountName');
    expect(out).not.toHaveProperty('gcsBucketName');
  });

  it('uses newly typed secrets and re-sends saved (redacted) ones when blank', () => {
    const typed = buildParametersOnSave(
      { ...s3Form(), awsAccessKeyId: 'AKIANEW', awsSecretAccessKey: 'new' },
      { awsAccessKeyId: '***', awsSecretAccessKey: '***' }
    );
    expect(typed.awsAccessKeyId).toBe('AKIANEW');
    const preserved = buildParametersOnSave(s3Form(), {
      awsAccessKeyId: '<redacted-a>',
      awsSecretAccessKey: '<redacted-b>',
    });
    expect(preserved.awsAccessKeyId).toBe('<redacted-a>');
    expect(preserved.awsSecretAccessKey).toBe('<redacted-b>');
  });

  it('azure form emits azure fields only', () => {
    const out = buildParametersOnSave(
      {
        ...emptyConfigForm(),
        provider: 'azure',
        azureAccountName: 'acct',
        azureContainerName: 'logs',
        azureAccountKey: 'a2V5',
      },
      {}
    );
    expect(out).toEqual({
      provider: 'azure',
      prefix: '',
      azureAccountName: 'acct',
      azureContainerName: 'logs',
      azureAccountKey: 'a2V5',
    });
  });

  it('gcs form emits gcs fields only, preserving a saved key', () => {
    const out = buildParametersOnSave(
      { ...emptyConfigForm(), provider: 'gcs', gcsBucketName: 'b' },
      { gcsServiceAccountKey: '<redacted>' }
    );
    expect(out).toEqual({
      provider: 'gcs',
      prefix: '',
      gcsBucketName: 'b',
      gcsServiceAccountKey: '<redacted>',
    });
  });
});

describe('missingRequiredParameters', () => {
  it('reports the selected provider requirements only', () => {
    expect(missingRequiredParameters({ ...emptyConfigForm(), provider: 'azure' }, {})).toEqual([
      'azureAccountName',
      'azureContainerName',
      'azureAccountKey',
    ]);
    expect(missingRequiredParameters(emptyConfigForm(), {})).toEqual([
      'bucketName',
      'region',
      'awsAccessKeyId',
      'awsSecretAccessKey',
    ]);
  });

  it('passes when required fields are typed or saved', () => {
    expect(
      missingRequiredParameters(
        { ...emptyConfigForm(), provider: 'gcs', gcsBucketName: 'b' },
        { gcsServiceAccountKey: '<redacted>' }
      )
    ).toEqual([]);
  });

  it('flags a newly typed GCS key that is not valid JSON with client_email/private_key', () => {
    expect(
      missingRequiredParameters(
        {
          ...emptyConfigForm(),
          provider: 'gcs',
          gcsBucketName: 'b',
          gcsServiceAccountKey: 'not json',
        },
        {}
      )
    ).toEqual(['gcsServiceAccountKey (invalid JSON — expected client_email and private_key)']);

    expect(
      missingRequiredParameters(
        {
          ...emptyConfigForm(),
          provider: 'gcs',
          gcsBucketName: 'b',
          gcsServiceAccountKey: JSON.stringify({ client_email: 'a@b.iam.gserviceaccount.com' }),
        },
        {}
      )
    ).toEqual(['gcsServiceAccountKey (invalid JSON — expected client_email and private_key)']);
  });

  it('passes a newly typed GCS key with the required client_email and private_key fields', () => {
    expect(
      missingRequiredParameters(
        {
          ...emptyConfigForm(),
          provider: 'gcs',
          gcsBucketName: 'b',
          gcsServiceAccountKey: JSON.stringify({
            client_email: 'a@b.iam.gserviceaccount.com',
            private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
          }),
        },
        {}
      )
    ).toEqual([]);
  });
});

describe('EGRESS_IPS', () => {
  it('is unchanged', () => {
    expect(EGRESS_IPS).toHaveLength(6);
  });
});
