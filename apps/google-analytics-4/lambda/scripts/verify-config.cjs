const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const stages = ['test', 'prd'];
const requiredKeys = [
  'signingSecret',
  'domainName',
  'serviceAccountKeyEncryptionSecret',
  'dynamoDbEndpoint',
];

const missingKeys = [];
for (const stage of stages) {
  const stageConfig = fs.readFileSync(
    path.join(rootDir, 'config', `serverless-env.${stage}.yml`),
    'utf8'
  );
  for (const key of requiredKeys) {
    if (!new RegExp(`^${key}:`, 'm').test(stageConfig)) {
      missingKeys.push(`${stage}: ${key}`);
    }
  }
}

if (missingKeys.length > 0) {
  console.error(`Missing config keys:\n${missingKeys.join('\n')}`);
  process.exit(1);
}

console.log(`Config keys present for stages: ${stages.join(', ')}.`);
