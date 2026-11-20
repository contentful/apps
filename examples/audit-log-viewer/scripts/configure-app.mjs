import 'dotenv/config';
import { createClient } from 'contentful-management';

const { CONTENTFUL_ACCESS_TOKEN, CONTENTFUL_ORG_ID, CONTENTFUL_APP_DEF_ID } = process.env;
if (!CONTENTFUL_ACCESS_TOKEN || !CONTENTFUL_ORG_ID || !CONTENTFUL_APP_DEF_ID) {
  console.error('Set CONTENTFUL_ACCESS_TOKEN, CONTENTFUL_ORG_ID, CONTENTFUL_APP_DEF_ID in .env');
  process.exit(1);
}
const client = createClient({ accessToken: CONTENTFUL_ACCESS_TOKEN }, { type: 'plain' });
const ids = { organizationId: CONTENTFUL_ORG_ID, appDefinitionId: CONTENTFUL_APP_DEF_ID };

const def = await client.appDefinition.get(ids);
def.parameters = {
  installation: [
    { id: 'provider', name: 'Storage provider (s3 | azure | gcs; empty = s3)', type: 'Symbol' },
    { id: 'prefix', name: 'Object key prefix (optional, must end with /)', type: 'Symbol' },
    // Amazon S3
    { id: 'bucketName', name: 'S3 bucket name', type: 'Symbol' },
    { id: 'region', name: 'AWS region (e.g. eu-west-1)', type: 'Symbol' },
    { id: 'roleArn', name: 'IAM role ARN to assume (optional)', type: 'Symbol' },
    { id: 'externalId', name: 'STS external ID (optional)', type: 'Symbol' },
    { id: 'awsAccessKeyId', name: 'AWS access key ID', type: 'Secret' },
    { id: 'awsSecretAccessKey', name: 'AWS secret access key', type: 'Secret' },
    // Azure Blob Storage
    { id: 'azureAccountName', name: 'Azure storage account name', type: 'Symbol' },
    { id: 'azureContainerName', name: 'Azure container name', type: 'Symbol' },
    { id: 'azureAccountKey', name: 'Azure storage account key', type: 'Secret' },
    // Google Cloud Storage
    { id: 'gcsBucketName', name: 'GCS bucket name', type: 'Symbol' },
    { id: 'gcsServiceAccountKey', name: 'GCS service account key (JSON)', type: 'Secret' },
  ],
};
await client.appDefinition.update(ids, def);
console.log('✔ installation parameters updated');

const ACTION = {
  name: 'listAuditLogFiles',
  description:
    'Lists audit log files for a date range and returns short-lived pre-signed GET URLs',
  type: 'function-invocation',
  function: { sys: { type: 'Link', linkType: 'Function', id: 'auditLogBroker' } },
  category: 'Custom',
  parameters: [
    { id: 'startDate', name: 'Start date (YYYY-MM-DD)', type: 'Symbol' },
    { id: 'endDate', name: 'End date (YYYY-MM-DD)', type: 'Symbol' },
  ],
};
const existing = await client.appAction.getMany(ids);
const found = existing.items.find((a) => a.name === ACTION.name);
if (found) {
  await client.appAction.update({ ...ids, appActionId: found.sys.id }, ACTION);
  console.log(`✔ app action updated: ${found.sys.id}`);
} else {
  const created = await client.appAction.create(ids, ACTION);
  console.log(`✔ app action created: ${created.sys.id}`);
}
