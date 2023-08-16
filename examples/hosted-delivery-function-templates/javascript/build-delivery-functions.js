const esbuild = require('esbuild');
const { join, parse, resolve } = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const manifest = require('./contentful-app-manifest.json');

const argv = yargs(hideBin(process.argv)).argv;

const validateActions = () => {
  const requiredProperties = ['id', 'path', 'entryFile'];
  const uniqueValues = new Set();

  if (manifest.deliveryFunctions.length > 1) {
    throw new Error(
      `The maximum amount of delivery functions is 1, found ${manifest.deliveryFunctions.length}`
    );
  }

  manifest.deliveryFunctions.forEach((deliveryFunction) => {
    requiredProperties.forEach((property) => {
      if (!deliveryFunction.hasOwnProperty(property)) {
        throw new Error(
          `Delivery function with name: '${deliveryFunction.name}' is missing the '${property}' property`
        );
      }
    });

    const { id, path, entryFile } = deliveryFunction;

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
  return manifest.deliveryFunctions.reduce((result, deliveryFunction) => {
    const fileProperties = parse(deliveryFunction.path);
    const fileName = join(fileProperties.dir, fileProperties.name);

    result[fileName] = resolve(__dirname, deliveryFunction.entryFile);

    return result;
  }, {});
};

const main = async (watch = false) => {
  try {
    console.log('Building delivery functions');
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
    console.error('Error building delivery functions');
    throw Error(e);
  }
};

main(argv._.includes('watch')).then(() => console.log('delivery functions built successfully'));
