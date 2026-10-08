#!/usr/bin/env node
/**
 * Verifies every app under apps/ is listed in SUPPORT_OWNERSHIP.md.
 * Run from repo root. Exits 1 if any app is missing.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'SUPPORT_OWNERSHIP.md');
const appsDir = path.join(repoRoot, 'apps');

function parseSupportOwnershipManifest(content) {
  const appIds = new Set();
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

    const cells = trimmed
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

    if (cells[0]?.replace(/-/g, '') === '') continue; // separator row
    if (cells[0]?.toLowerCase() === 'app id') continue; // header row
    if (cells[0]) appIds.add(cells[0]);
  }
  return appIds;
}

function getAppDirectories() {
  if (!fs.existsSync(appsDir)) return [];
  return fs.readdirSync(appsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

const appDirs = getAppDirectories();
if (appDirs.length === 0) {
  console.log('No apps directory or no app subdirectories found.');
  process.exit(0);
}

if (!fs.existsSync(manifestPath)) {
  console.error('SUPPORT_OWNERSHIP.md is missing at repo root. Add it with a table: | App id | App name | Support owner | Support link |');
  console.error('Required app ids:', appDirs.join(', '));
  process.exit(1);
}

const content = fs.readFileSync(manifestPath, 'utf-8');
const listedIds = parseSupportOwnershipManifest(content);
const missing = appDirs.filter((id) => !listedIds.has(id));

if (missing.length > 0) {
  console.error('SUPPORT_OWNERSHIP.md is missing entries for these app ids:', missing.join(', '));
  console.error('Add a row for each with App id (directory name), App name, Support owner, and Support link.');
  process.exit(1);
}

console.log('Support ownership check passed: all', appDirs.length, 'apps are listed.');
