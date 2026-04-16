/**
 * Runs contentful-app-scripts upsert-actions with env vars from .env.
 */
const { spawnSync } = require('child_process');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const result = spawnSync(
  'npx',
  [
    'contentful-app-scripts',
    'upsert-actions',
    '--ci',
    '--manifest-file',
    'contentful-app-manifest.json',
    '--organization-id',
    process.env.CONTENTFUL_ORG_ID,
    '--definition-id',
    process.env.CONTENTFUL_APP_DEF_ID,
    '--token',
    process.env.CONTENTFUL_ACCESS_TOKEN,
    '--host',
    'api.contentful.com',
  ],
  { stdio: 'inherit', env: process.env, cwd: path.join(__dirname, '..') }
);
process.exit(result.status ?? 1);
