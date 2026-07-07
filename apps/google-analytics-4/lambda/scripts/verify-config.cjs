const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const sourceConfigPath = path.join(rootDir, 'serverless.yml');
const tempConfigPath = path.join(rootDir, '.serverless.verify-config.yml');

const stage = process.env.CIRCLE_BRANCH === 'master' ? 'prd' : 'test';

const sourceConfig = fs.readFileSync(sourceConfigPath, 'utf8');

const sanitizedConfig = sourceConfig.replace(/\n  - serverless-offline(?=\n)/, '');

fs.writeFileSync(tempConfigPath, sanitizedConfig);

try {
  execFileSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['serverless', 'print', '--config', tempConfigPath, '--stage', stage],
    {
      cwd: rootDir,
      stdio: 'inherit',
      env: process.env,
    }
  );
} finally {
  fs.rmSync(tempConfigPath, { force: true });
}
