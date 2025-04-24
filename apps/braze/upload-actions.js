const fs = require('fs');
const archiver = require('archiver');
const contentful = require('contentful-management');
require('dotenv').config();

const CMA_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const ORG_ID = process.env.CONTENTFUL_ORG_ID;
const DEFINITION_ID = process.env.CONTENTFUL_APP_DEF_ID;

console.log(`CMA_TOKEN: ${CMA_TOKEN}`);
console.log(`ORG_ID: ${ORG_ID}`);
console.log(`DEFINITION_ID: ${DEFINITION_ID}`);

if (!CMA_TOKEN || !ORG_ID || !DEFINITION_ID) {
  console.error('❌ Faltan variables de entorno. Verificá tu archivo .env');
  process.exit(1);
}

async function zipBuildDir() {
  const output = fs.createWriteStream('app-bundle.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve('app-bundle.zip');
    });

    archive.on('error', reject);
    archive.pipe(output);
    archive.directory('build/', false);
    archive.finalize();
  });
}

async function uploadActions() {
  const client = contentful.createClient({ accessToken: CMA_TOKEN });

  const zipPath = await zipBuildDir();
  const zipFile = fs.readFileSync(zipPath);

  const org = await client.getOrganization(ORG_ID);
  const upload = await org.createAppUpload({ file: zipFile });

  console.log('📦 Uploaded bundle:', upload.sys.id);

  const appDefinition = await org.getAppDefinition(DEFINITION_ID);

  await appDefinition.createAppBundle({
    upload: {
      sys: {
        type: 'Link',
        linkType: 'AppUpload',
        id: upload.sys.id,
      },
    },
    actions: require('./contentful-app-manifest.json').actions,
    comment: 'Subida solo de backend (acciones)',
  });

  console.log('✅ Bundle subido con éxito!');
}

uploadActions().catch((err) => {
  console.error('❌ Error subiendo bundle:', err.message || err);
  process.exit(1);
});
