const esbuild = require('esbuild');
const { resolve } = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const manifest = require('./contentful-app-manifest.json');

const argv = yargs(hideBin(process.argv)).argv;

const validateActions = () => {
  const requiredProperties = ['id', 'path', 'entryFile'];
  const uniqueValues = new Set();

  manifest.actions.forEach((action) => {
    requiredProperties.forEach((property) => {
      if (!action.hasOwnProperty(property)) {
        throw new Error(`Action with name: '${action.name}' is missing the '${property}' property`);
      }
    });

    const { id, path, entryFile } = action;

    if (uniqueValues.has(id)) {
      throw new Error(`Duplicate action id: '${id}'`);
    }
    if (uniqueValues.has(path)) {
      throw new Error(`Duplicate action path: '${path}'`);
    }
    if (uniqueValues.has(entryFile)) {
      throw new Error(`Duplicate entryFile path: '${entryFile}'`);
    }

    uniqueValues.add(entryFile);
    uniqueValues.add(path);
    uniqueValues.add(id);
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
    console.log('Building app actions');
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
      external: ['node:*'],
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
