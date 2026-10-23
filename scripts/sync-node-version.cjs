#!/usr/bin/env node
/* eslint-disable no-console */
// Syncs Node.js version declarations to the root .nvmrc. Flags: --check, --only <dir>.

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const onlyIndex = args.indexOf('--only');
const only = onlyIndex === -1 ? null : path.resolve(ROOT, args[onlyIndex + 1] || '');
if (only && !only.startsWith(path.join(ROOT, 'apps') + path.sep)) {
  console.error('--only must point to a directory inside apps/');
  process.exit(2);
}

const version = fs.readFileSync(path.join(ROOT, '.nvmrc'), 'utf8').trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Root .nvmrc must contain a full version such as 24.22.1 (found "${version}")`);
  process.exit(2);
}
const major = version.split('.')[0];

const drift = [];
const written = [];

function record(file, description, next, current) {
  if (next === current) return;
  const relative = path.relative(ROOT, file);
  drift.push(`${relative}: ${description}`);
  if (!checkOnly) {
    fs.writeFileSync(file, next);
    written.push(relative);
  }
}

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else visit(full);
  }
}

function syncNvmrc(dir) {
  const file = path.join(dir, '.nvmrc');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  record(file, `.nvmrc should be ${version}`, `${version}\n`, current);
}

// Text edit, so the rest of package.json keeps its formatting.
function setEngines(source) {
  const range = `>=${major}`;
  const engines = /("engines"\s*:\s*\{)([^}]*)(\})/;
  const match = source.match(engines);
  if (match) {
    if (/"node"\s*:/.test(match[2])) {
      return source.replace(/("engines"\s*:\s*\{[^}]*"node"\s*:\s*)"[^"]*"/, `$1"${range}"`);
    }
    const body = match[2].trimEnd();
    const separator = body.trim() === '' ? '' : ',';
    return source.replace(engines, `$1${body}${separator}\n    "node": "${range}"\n  $3`);
  }
  const anchor =
    source.match(/^ {2}"version": "[^"]*",\n/m) || source.match(/^ {2}"name": "[^"]*",\n/m);
  const block = `  "engines": {\n    "node": "${range}"\n  },\n`;
  if (anchor) return source.replace(anchor[0], `${anchor[0]}${block}`);
  return source.replace(/^\{\n/, `{\n${block}`);
}

function syncPackageJson(file) {
  const current = fs.readFileSync(file, 'utf8');
  record(file, `engines.node should be >=${major}`, setEngines(current), current);
}

function resolveDigest(tag) {
  return new Promise((resolve) => {
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(tag)) return resolve(null);
    https
      .get(
        `https://hub.docker.com/v2/repositories/library/node/tags/${encodeURIComponent(tag)}`,
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(body).digest || null);
            } catch (e) {
              resolve(null);
            }
          });
        }
      )
      .on('error', () => resolve(null));
  });
}

async function syncDockerfile(file) {
  const current = fs.readFileSync(file, 'utf8');
  const from = /^FROM node:(\d+(?:\.\d+){0,2})(-[a-z0-9.-]+)?(@sha256:[a-f0-9]{64})?/gm;
  let next = current;
  for (const match of current.matchAll(from)) {
    const [line, tagVersion, rawSuffix = '', digest] = match;
    const suffix = rawSuffix.replace('buster', 'bookworm');
    if (tagVersion === version && suffix === rawSuffix) continue;
    const tag = `${version}${suffix}`;
    // An unresolvable digest is dropped so Renovate re-pins it.
    const newDigest = digest && !checkOnly ? await resolveDigest(tag) : null;
    next = next.replace(line, `FROM node:${tag}${newDigest ? `@${newDigest}` : ''}`);
  }
  record(file, `FROM node should be ${version}`, next, current);
}

function syncServerless(file) {
  const current = fs.readFileSync(file, 'utf8');
  const next = current.replace(/^(\s*runtime:\s*)nodejs\d+\.x/gm, `$1nodejs${major}.x`);
  record(file, `runtime should be nodejs${major}.x`, next, current);
}

function syncCircleci() {
  const file = path.join(ROOT, '.circleci', 'config.yml');
  const current = fs.readFileSync(file, 'utf8');
  const next = current.replace(/(cimg\/node:)\d+\.\d+\.\d+/g, `$1${version}`);
  record(file, `cimg/node should be ${version}`, next, current);
}

async function main() {
  const scope = only || path.join(ROOT, 'apps');
  if (!fs.existsSync(scope)) {
    console.error(`Nothing to sync at ${path.relative(ROOT, scope)}`);
    process.exit(2);
  }

  const dockerfiles = [];
  walk(scope, (file) => {
    const name = path.basename(file);
    if (name === 'package.json') {
      syncNvmrc(path.dirname(file));
      syncPackageJson(file);
    } else if (/^Dockerfile(\..+)?$/.test(name)) {
      dockerfiles.push(file);
    } else if (/^serverless\.ya?ml$/.test(name)) {
      syncServerless(file);
    }
  });
  for (const file of dockerfiles) await syncDockerfile(file);

  if (!only) {
    syncCircleci();
    const rootPackage = path.join(ROOT, 'package.json');
    const current = fs.readFileSync(rootPackage, 'utf8');
    record(rootPackage, `engines.node should be >=${major}`, setEngines(current), current);
  }

  if (checkOnly) {
    if (drift.length) {
      console.error(`Node.js version declarations differ from .nvmrc (${version}):`);
      drift.forEach((line) => console.error(`  ${line}`));
      console.error('\nRun `npm run node:sync` to fix them.');
      process.exit(1);
    }
    console.log(`All Node.js version declarations match ${version}.`);
    return;
  }
  console.log(`Synced ${written.length} file(s) to Node.js ${version}.`);
}

main();
