const esbuild = require('esbuild');
const { resolve } = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const manifest = require('./contentful-app-manifest.json');

const argv = yargs(hideBin(process.argv)).argv;

const validateActions = () => {
  const uniqueValues = new Set();

  manifest.actions.forEach((action) => {
    if (uniqueValues.has(action.id)) {
      throw new Error(`Duplicate action id: ${action.id}`);
    }
    if (uniqueValues.has(action.path)) {
      throw new Error(`Duplicate action path: ${action.path}`);
    }
    if (uniqueValues.has(action.entryFile)) {
      throw new Error(`Duplicate entryFile path: ${action.entryFile}`);
    }

    uniqueValues.add(action.entryFile);
    uniqueValues.add(action.path);
    uniqueValues.add(action.id);
  });
};

const getEntryPoints = () => {
  return manifest.actions.reduce((result, action) => {
    const fileName = action.path.split('.')[0];

    result[fileName] = resolve(__dirname, action.entryFile);

    return result;
  }, {});
};

const main = async (watch = false) => {
  try {
    validateActions();

    const config = {
      entryPoints: getEntryPoints(),
      minify: true,
      bundle: true,
      platform: 'node',
      outdir: 'build',
      logLevel: 'info',
      format: 'esm',
      target: 'es6',
    };

    if (watch) {
      const context = await esbuild.context(config);
      await context.watch();
    } else {
      await esbuild.build(config);
    }
  } catch (e) {
    console.log('Error building app actions');
    throw Error(e);
  }
};

main(argv._.includes('watch')).then(() => console.log('actions built successfully'));
