#!/usr/bin/env node
/**
 * Interactive setup for local Jira app development.
 * Run from apps/jira:  npm run setup
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const ENV_EXAMPLE = path.join(ROOT, '.env.example');

function log(msg) {
  console.log(msg);
}
function warn(msg) {
  console.warn('\x1b[33m%s\x1b[0m', msg);
}
function success(msg) {
  console.log('\x1b[32m%s\x1b[0m', msg);
}
function bold(msg) {
  return `\x1b[1m${msg}\x1b[0m`;
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve((answer || '').trim()));
  });
}

function parseEnv(content) {
  const out = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

function checkDeps() {
  const jiraNodeModules = path.join(ROOT, 'node_modules');
  const functionsNodeModules = path.join(ROOT, 'functions', 'node_modules');
  const jiraOk = fs.existsSync(jiraNodeModules);
  const fnOk = fs.existsSync(functionsNodeModules);
  return { jiraOk, fnOk };
}

function ensureEnv() {
  if (fs.existsSync(ENV_PATH)) return true;
  if (!fs.existsSync(ENV_EXAMPLE)) return false;
  fs.copyFileSync(ENV_EXAMPLE, ENV_PATH);
  return true;
}

function getEnvVars() {
  if (!fs.existsSync(ENV_PATH)) return null;
  return parseEnv(fs.readFileSync(ENV_PATH, 'utf8'));
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  log('\n' + bold('Contentful Jira App – Local setup') + '\n');

  // 1. Dependencies
  const { jiraOk, fnOk } = checkDeps();
  if (!jiraOk || !fnOk) {
    warn('Missing dependencies. Run:');
    if (!jiraOk) log('  cd apps/jira && npm install');
    if (!fnOk) log('  cd apps/jira/functions && npm install');
    log('');
    rl.close();
    process.exit(1);
  }
  success('✓ Dependencies installed\n');

  // 2. .env
  if (!ensureEnv()) {
    warn('No .env or .env.example found.');
    rl.close();
    process.exit(1);
  }
  const env = getEnvVars();
  const required = ['NGROK_AUTHTOKEN', 'ATLASSIAN_APP_CLIENT_ID', 'ATLASSIAN_APP_CLIENT_SECRET'];
  const missing = required.filter((k) => !env[k] || env[k].length === 0);

  if (missing.length) {
    warn('Missing or empty in .env: ' + missing.join(', '));
    log('');
    log('  Edit: apps/jira/.env');
    log('');
    log('  • NGROK_AUTHTOKEN: get at https://dashboard.ngrok.com/get-started/your-authtoken');
    log(
      '  • ATLASSIAN_APP_CLIENT_ID / ATLASSIAN_APP_CLIENT_SECRET: from https://developer.atlassian.com/console/myapps/'
    );
    log('');
    const runAnyway = await ask(rl, 'Continue to checklist anyway? (y/n): ');
    if (runAnyway.toLowerCase() !== 'y' && runAnyway.toLowerCase() !== 'yes') {
      rl.close();
      process.exit(0);
    }
  } else {
    success('✓ .env configured\n');
  }

  // 3. Atlassian checklist
  log(bold('Atlassian app checklist (one-time per app):'));
  log('');
  log('  1. Open: https://developer.atlassian.com/console/myapps/');
  log('  2. Select your app (or create one) → Authorization');
  log('  3. Callback URLs: add exactly (ngrok URL changes each run):');
  log('     ' + bold('https://YOUR_NGROK_URL/test/auth'));
  log('     (The dev server will print the real URL when it starts.)');
  log('  4. Permissions → Jira API: add scopes');
  log(
    '     ' +
      bold('read:jira-user') +
      ', ' +
      bold('read:jira-work') +
      ', ' +
      bold('write:jira-work')
  );
  log('  5. Save changes.');
  log('');

  log(bold('When you run dev:'));
  log('  • Frontend: http://localhost:1234');
  log('  • Lambda:   http://localhost:3000 (routes under /test/)');
  log(
    '  • Copy the printed "In Atlassian OAuth callback URL use: ..." into your Atlassian app if the ngrok URL changed.'
  );
  log('');

  const start = await ask(rl, 'Start dev server now? (y/n): ');
  rl.close();

  if (start.toLowerCase() === 'y' || start.toLowerCase() === 'yes') {
    log('');
    process.env.PORT = process.env.PORT || '1234';
    const { spawn } = require('child_process');
    const child = spawn('npm', ['run', 'dev'], {
      env: process.env,
      stdio: 'inherit',
      shell: true,
      cwd: ROOT,
    });
    child.on('exit', (code) => process.exit(code ?? 0));
  } else {
    log('');
    log('Run when ready: ' + bold('PORT=1234 npm run dev'));
    log('');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
