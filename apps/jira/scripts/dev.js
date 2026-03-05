const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const jsYaml = require('js-yaml');
const ngrok = require('@ngrok/ngrok');

const PATH = {
  SERVERLESS_YAML: path.join(__dirname, '..', 'functions', 'serverless.yml'),
  SERVERLESS_BU_YAML: path.join(__dirname, '..', 'functions', 'serverless.yml.bu'),
};

let childProcess = null;

// Backup serverless.yml
fs.copyFileSync(PATH.SERVERLESS_YAML, PATH.SERVERLESS_BU_YAML);

// Generate development serverless yaml
const serverlessYaml = fs.readFileSync(PATH.SERVERLESS_YAML, 'utf8');
const config = jsYaml.load(serverlessYaml);
if (!config.plugins.includes('serverless-offline')) {
  config.plugins.push('serverless-offline');
}
fs.writeFileSync(PATH.SERVERLESS_YAML, jsYaml.dump(config));

function startApp(url) {
  process.env.NODE_ENV = 'development';
  process.env.NGROK_URL = url;
  process.env.AWS_ACCOUNT_ID = 'yolo'; // doesn't matter, it's local
  process.env.OAUTH_CREDENTIALS_SECRET_ID = 'yolo'; // doesn't matter, it's local
  process.env.OAUTH_REDIRECT_URI = `${url}/test/auth`;
  process.env.OAUTH_TOKEN_EXCHANGE_ENDPOINT = 'https://auth.atlassian.com/oauth/token';
  process.env.FRONTEND_URL = 'http://localhost:' + (process.env.PORT || '1234');

  console.log(`> Lambda base URL: ${url}`);
  console.log('> Frontend: http://localhost:' + (process.env.PORT || '1234'));
  console.log('> In Atlassian OAuth callback URL use: ' + url + '/test/auth');
  console.log('> First time? Run npm run setup for a guided checklist.');

  childProcess = spawn('npm', ['run', 'start'], {
    env: process.env,
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..'),
  });

  childProcess.on('error', (err) => {
    console.error('Failed to start:', err);
    cleanBackup();
    process.exit(1);
  });
  childProcess.on('exit', (code) => {
    cleanBackup();
    process.exit(code ?? 0);
  });
}

// Use existing NGROK_URL if set (e.g. you ran "ngrok http 3000" in another terminal)
if (process.env.NGROK_URL) {
  const url = process.env.NGROK_URL.replace(/\/$/, '');
  console.log('> Using existing NGROK_URL');
  startApp(url);
  return;
}

// Otherwise start ngrok programmatically (requires NGROK_AUTHTOKEN)
async function run() {
  if (!process.env.NGROK_AUTHTOKEN) {
    console.error('ngrok: NGROK_AUTHTOKEN is not set.');
    console.error('');
    console.error('  Get a free token: https://dashboard.ngrok.com/signup');
    console.error('  Then: https://dashboard.ngrok.com/get-started/your-authtoken');
    console.error('');
    console.error('  Add to apps/jira/.env:');
    console.error('    NGROK_AUTHTOKEN=your_token_here');
    console.error('');
    console.error('  Or run ngrok manually:  ngrok http 3000');
    console.error('  Then:  NGROK_URL=https://YOUR_SUBDOMAIN.ngrok-free.app npm run dev');
    cleanBackup();
    process.exit(1);
    return;
  }

  try {
    const listener = await ngrok.forward({
      addr: 3000,
      authtoken_from_env: true,
    });
    const url = listener.url();
    startApp(url);
  } catch (err) {
    console.error('ngrok failed:', err.message || err);
    console.error('');
    console.error(
      '  Check NGROK_AUTHTOKEN is correct: https://dashboard.ngrok.com/get-started/your-authtoken'
    );
    cleanBackup();
    process.exit(1);
  }
}

run();

let isBackupCleaned = false;
const cleanBackup = () => {
  if (!isBackupCleaned) {
    if (childProcess) {
      try {
        childProcess.kill('SIGINT');
      } catch (_) {}
    }
    fs.unlinkSync(PATH.SERVERLESS_YAML);
    fs.renameSync(PATH.SERVERLESS_BU_YAML, PATH.SERVERLESS_YAML);
    isBackupCleaned = true;
  }
};

process.on('uncaughtException', cleanBackup);
process.on('unhandledRejection', cleanBackup);
process.on('exit', cleanBackup);
process.on('SIGINT', cleanBackup);
process.on('SIGUSR1', cleanBackup);
process.on('SIGUSR2', cleanBackup);
