const fs = require('fs');
const path = require('path');

const npm = require('npm');
const jsYaml = require('js-yaml');
const ngrok = require('ngrok');

const PATH = {
  SERVERLESS_YAML: path.join(__dirname, '..', 'functions', 'serverless.yml'),
  SERVERLESS_BU_YAML: path.join(__dirname, '..', 'functions', 'serverless.yml.bu'),
};

// Backup serverless.yml
fs.copyFileSync(PATH.SERVERLESS_YAML, PATH.SERVERLESS_BU_YAML);

// Generate development serverless yaml
const serverlessYaml = fs.readFileSync(PATH.SERVERLESS_YAML);
const config = jsYaml.safeLoad(serverlessYaml);
config.plugins.push('serverless-offline');
fs.writeFileSync(PATH.SERVERLESS_YAML, jsYaml.safeDump(config));

npm.load({ loaded: false }, () => {
  ngrok.connect({ port: 3000 }).then((url) => {
    process.env.NODE_ENV = 'development';
    process.env.NGROK_URL = url;
    process.env.AWS_ACCOUNT_ID = 'yolo'; // doesn't matter, it's local
    process.env.OAUTH_CREDENTIALS_SECRET_ID = 'yolo'; // doesn't matter, it's local
    process.env.OAUTH_REDIRECT_URI = `${url}/dev/auth`;
    process.env.OAUTH_TOKEN_EXCHANGE_ENDPOINT = 'https://auth.atlassian.com/oauth/token';
    process.env.FRONTEND_URL = 'http://localhost:1234';

    console.log(`> Running Lambda on ${url}`);

    npm.run('start');
  });
});

let isBackupCleaned = false;
const cleanBackup = () => {
  if (!isBackupCleaned) {
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
