import 'dotenv/config';

// Dev helper: (re-)installs the app into the test space with parameters from
// .env. Needed after every bundle upload — activation wipes the installation
// parameters (see docs/superpowers/plans/gate-result.md).
const e = process.env;
const provider = (e.PROVIDER || 's3').toLowerCase();

const contentfulRequired = ['CONTENTFUL_ACCESS_TOKEN', 'CONTENTFUL_SPACE_ID', 'CONTENTFUL_APP_DEF_ID'];
const providerRequired = {
  s3: ['AWS_BUCKET_NAME', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
  azure: ['AZURE_ACCOUNT_NAME', 'AZURE_CONTAINER_NAME', 'AZURE_ACCOUNT_KEY'],
  gcs: ['GCS_BUCKET_NAME', 'GCS_SERVICE_ACCOUNT_KEY_FILE'],
};
if (!providerRequired[provider]) {
  console.error(`Unknown PROVIDER "${provider}" (use s3, azure or gcs)`);
  process.exit(1);
}
const missing = [...contentfulRequired, ...providerRequired[provider]].filter((k) => !e[k]);
if (missing.length) {
  console.error(`Set ${missing.join(', ')} in .env`);
  process.exit(1);
}

const params = { provider };
if (e.AWS_PREFIX || e.STORAGE_PREFIX) params.prefix = e.STORAGE_PREFIX || e.AWS_PREFIX;
if (provider === 's3') {
  params.bucketName = e.AWS_BUCKET_NAME;
  params.region = e.AWS_REGION;
  params.awsAccessKeyId = e.AWS_ACCESS_KEY_ID;
  params.awsSecretAccessKey = e.AWS_SECRET_ACCESS_KEY;
  if (e.AWS_ROLE_ARN) params.roleArn = e.AWS_ROLE_ARN;
  if (e.AWS_EXTERNAL_ID) params.externalId = e.AWS_EXTERNAL_ID;
} else if (provider === 'azure') {
  params.azureAccountName = e.AZURE_ACCOUNT_NAME;
  params.azureContainerName = e.AZURE_CONTAINER_NAME;
  params.azureAccountKey = e.AZURE_ACCOUNT_KEY;
} else {
  const { readFileSync } = await import('node:fs');
  params.gcsBucketName = e.GCS_BUCKET_NAME;
  params.gcsServiceAccountKey = readFileSync(e.GCS_SERVICE_ACCOUNT_KEY_FILE, 'utf8');
}

const res = await fetch(
  `https://api.contentful.com/spaces/${e.CONTENTFUL_SPACE_ID}/environments/${
    e.CONTENTFUL_ENVIRONMENT_ID || 'master'
  }/app_installations/${e.CONTENTFUL_APP_DEF_ID}`,
  {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${e.CONTENTFUL_ACCESS_TOKEN}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
    },
    body: JSON.stringify({ parameters: params }),
  },
);
if (!res.ok) {
  console.error(`Install failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
console.log('✔ app installed with parameters from .env');
