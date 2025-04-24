const esbuild = require('esbuild');
const { resolve } = require('path');
const manifest = require('./contentful-app-manifest.json');

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

    await esbuild.build({
      entryPoints: [entryFile],
      minify: false,
      bundle: true,
      platform: 'node',
      outdir: 'build/actions',
      format: 'cjs',
      target: 'es2022',
      logLevel: 'info',
      external: ['node:*', 'sharp'],
      loader: { '.ts': 'ts' },
    });

    console.log('✅ Actions built successfully!');
  } catch (error) {
    console.error('❌ Error building app actions');
    console.error(error);
    process.exit(1);
  }
};

main();
