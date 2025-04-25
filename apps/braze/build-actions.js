const esbuild = require('esbuild');
const { resolve } = require('path');
const manifest = require('./contentful-app-manifest.json');
const fs = require('fs');

const entryFile = 'backend/src/actions/braze-handler.ts';

const validateActions = () => {
  const requiredProperties = ['id', 'path'];
  const ids = new Set();

  manifest.actions.forEach((action) => {
    requiredProperties.forEach((prop) => {
      if (!action.hasOwnProperty(prop)) {
        throw new Error(`Action '${action.name}' is missing required property '${prop}'`);
      }
    });

    if (ids.has(action.id)) {
      throw new Error(`Duplicate action id: '${action.id}'`);
    }
    ids.add(action.id);
  });
};

const main = async () => {
  try {
    console.log('🔧 Building app actions...');
    validateActions();

    // Ensure build-backend directory exists
    if (!fs.existsSync('build-backend')) {
      fs.mkdirSync('build-backend', { recursive: true });
    }

    // Build the action file
    await esbuild.build({
      entryPoints: [entryFile],
      minify: false,
      bundle: true,
      platform: 'node',
      outdir: 'build-backend/actions',
      format: 'cjs',
      target: 'es2022',
      logLevel: 'info',
      external: ['node:*', 'sharp'],
      loader: { '.ts': 'ts' },
    });

    // Copy the manifest file to build-backend
    fs.copyFileSync('contentful-app-manifest.json', 'build-backend/contentful-app-manifest.json');

    console.log('✅ Actions built successfully!');
  } catch (error) {
    console.error('❌ Error building app actions');
    console.error(error);
    process.exit(1);
  }
};

main();
