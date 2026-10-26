const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const sourceConfigPath = path.join(rootDir, 'serverless.yml');
const tempConfigPath = path.join(rootDir, '.serverless.verify-config.yml');

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

const sourceConfig = fs.readFileSync(sourceConfigPath, 'utf8');

const sanitizedConfig = sourceConfig.replace(/\n  - serverless-offline(?=\n)/, '');

fs.writeFileSync(tempConfigPath, sanitizedConfig);

try {
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['serverless', 'print', '--config', tempConfigPath, '--stage', 'test'],
    {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    }
  );

  if (result.status !== 0) {
    console.error('Serverless config did not resolve for stage "test".');
    process.exitCode = result.status || 1;
  } else {
    console.log('Serverless config resolved for stage "test".');
  }
} finally {
  fs.rmSync(tempConfigPath, { force: true });
}
