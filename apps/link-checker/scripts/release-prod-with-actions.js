/**
 * Builds, uploads, and upserts actions for the production Link Checker app definition.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');
const env = {
  ...process.env,
  CONTENTFUL_ORG_ID: process.env.DEFINITIONS_ORG_ID,
  CONTENTFUL_APP_DEF_ID: '55HqLhaYLjQWU5zPfID6mX',
  CONTENTFUL_ACCESS_TOKEN: process.env.CONTENTFUL_CMA_TOKEN,
};

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd,
    env,
  });

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npm', ['run', 'build:all']);
run('npx', [
  'contentful-app-scripts',
  'upload',
  '--ci',
  '--bundle-dir',
  './build',
  '--organization-id',
  env.CONTENTFUL_ORG_ID,
  '--definition-id',
  env.CONTENTFUL_APP_DEF_ID,
  '--token',
  env.CONTENTFUL_ACCESS_TOKEN,
  '--comment',
  `Build uploaded at ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`,
  '--host',
  'api.contentful.com',
]);
run('npx', [
  'contentful-app-scripts',
  'upsert-actions',
  '--ci',
  '--manifest-file',
  'contentful-app-manifest.json',
  '--organization-id',
  env.CONTENTFUL_ORG_ID,
  '--definition-id',
  env.CONTENTFUL_APP_DEF_ID,
  '--token',
  env.CONTENTFUL_ACCESS_TOKEN,
  '--host',
  'api.contentful.com',
]);
