const fs = require('fs');
const path = require('path');
const jsYaml = require('js-yaml');
const localtunnel = require('localtunnel');
const { exec } = require('child_process');

const PATH = {
  SERVERLESS_YAML: path.join(__dirname, '..', 'serverless.yml'),
  SERVERLESS_BU_YAML: path.join(__dirname, '..', 'serverless.yml.bu'),
};

// Backup serverless.yml
fs.copyFileSync(PATH.SERVERLESS_YAML, PATH.SERVERLESS_BU_YAML);

// Generate development serverless yaml
const serverlessYaml = fs.readFileSync(PATH.SERVERLESS_YAML);
const config = jsYaml.safeLoad(serverlessYaml);

if (!config.plugins.includes('serverless-offline')) {
  config.plugin.push('serverless-offline');
}

fs.writeFileSync(PATH.SERVERLESS_YAML, jsYaml.safeDump(config));

(async () => {
  try {
    const tunnel = await localtunnel({ port: 3000 });

    process.env.NODE_ENV = 'development';
    process.env.AWS_ACCOUNT_ID = 'yolo'; // doesn't matter, it's local
    process.env.OAUTH_CREDENTIALS_SECRET_ID = 'yolo'; // doesn't matter, it's local
    process.env.FRONTEND_URL = 'http://localhost:1234';

    console.log(`> Running Lambda on ${tunnel.url}`);

    const child = exec('npm start', { stdio: 'inherit' });
    child.stdout?.on('data', (data) => console.log(data.toString()));
    child.stderr?.on('data', (data) => console.error(data.toString()));

    child.on('close', (code) => {
      console.log(`npm start exited with code ${code}`);
      tunnel.close();
    });
  } catch (error) {
    console.error('Error starting localtunnel:', error);
  }
})();

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
