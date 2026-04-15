/**
 * Runs contentful-app-scripts upload with env vars from .env.
 * npm scripts expand $VAR in the shell (which doesn't load .env), so the token was empty.
 */
const { spawnSync } = require('child_process');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const comment = `Build uploaded at ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`;

const result = spawnSync(
  'npx',
  [
    'contentful-app-scripts',
    'upload',
    '--ci',
    '--bundle-dir',
    './build',
    '--organization-id',
    process.env.CONTENTFUL_ORG_ID,
    '--definition-id',
    process.env.CONTENTFUL_APP_DEF_ID,
    '--token',
    process.env.CONTENTFUL_ACCESS_TOKEN,
    '--comment',
    comment,
    '--host',
    'api.contentful.com',
  ],
  { stdio: 'inherit', env: process.env, cwd: path.join(__dirname, '..') }
);
process.exit(result.status ?? 1);
