const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// Add debug logging for .env file
const envPath = path.resolve(process.cwd(), '.env');
console.log('🔍 Looking for .env file at:', envPath);
console.log('📂 .env file exists:', fs.existsSync(envPath));

const CMA_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const ORG_ID = process.env.CONTENTFUL_ORG_ID;
const DEFINITION_ID = process.env.CONTENTFUL_APP_DEF_ID;

console.log('🔑 Environment variables loaded:');
console.log('- CONTENTFUL_ACCESS_TOKEN length:', CMA_TOKEN ? CMA_TOKEN.length : 0);
console.log('- CONTENTFUL_ACCESS_TOKEN starts with:', CMA_TOKEN ? CMA_TOKEN.substring(0, 5) : 'N/A');
console.log('- CONTENTFUL_ORG_ID:', ORG_ID ? '✅ Present' : '❌ Missing');
console.log('- CONTENTFUL_APP_DEF_ID:', DEFINITION_ID ? '✅ Present' : '❌ Missing');

if (!CMA_TOKEN || !ORG_ID || !DEFINITION_ID) {
  console.error('❌ Missing environment variables. Please check your .env file');
  process.exit(1);
}

async function uploadActions() {
  try {
    console.log('📦 Creating bundle...');
    
    // Create a temporary directory for the bundle
    const bundleDir = 'temp-bundle';
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir);
    }

    // Create actions directory
    const actionsDir = path.join(bundleDir, 'actions');
    if (!fs.existsSync(actionsDir)) {
      fs.mkdirSync(actionsDir);
    }

    // Create a minimal frontend directory with index.html
    const frontendDir = path.join(bundleDir, 'frontend');
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir);
    }

    // Create a minimal index.html
    const indexHtmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Braze Integration</title>
    <meta charset="utf-8">
</head>
<body>
    <div id="root"></div>
</body>
</html>
`;
    fs.writeFileSync(path.join(frontendDir, 'index.html'), indexHtmlContent);

    // Debug: Check if source file exists
    const sourceFile = 'build-backend/actions/braze-handler.js';
    console.log('🔍 Checking source file:', sourceFile);
    console.log('📂 Source file exists:', fs.existsSync(sourceFile));

    // Copy the action file
    const targetFile = path.join(bundleDir, 'actions/braze-handler.js');
    console.log('📝 Copying to target file:', targetFile);
    fs.copyFileSync(sourceFile, targetFile);

    // Debug: Verify the file was copied
    console.log('✅ Target file exists:', fs.existsSync(targetFile));

    // Copy the manifest file
    fs.copyFileSync(
      'contentful-app-manifest.json',
      path.join(bundleDir, 'contentful-app-manifest.json')
    );

    // Debug: List the contents of the bundle directory
    console.log('📂 Bundle directory structure:');
    const listFiles = (dir, prefix = '') => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        console.log(`${prefix}${file}${stat.isDirectory() ? '/' : ''}`);
        if (stat.isDirectory()) {
          listFiles(filePath, prefix + '  ');
        }
      });
    };
    listFiles(bundleDir);

    // Create the zip file
    const zipOutput = fs.createWriteStream('app-bundle.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      zipOutput.on('close', () => {
        console.log('📦 Zip file created successfully');
        resolve();
      });

      archive.on('error', (err) => {
        console.error('❌ Error creating zip file:', err);
        reject(err);
      });

      archive.pipe(zipOutput);
      archive.directory(bundleDir, false);
      archive.finalize();
    });

    // Clean up temporary directory
    fs.rmSync(bundleDir, { recursive: true, force: true });

    console.log('📤 Uploading bundle...');
    const command = `contentful-app-scripts upload --ci --bundle-dir . --organization-id ${ORG_ID} --definition-id ${DEFINITION_ID} --token ${CMA_TOKEN}`;
    console.log('Running command:', command);
    
    const uploadOutput = execSync(command, { stdio: 'inherit' });
    console.log('✅ Upload completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

uploadActions();
