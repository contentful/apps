const esbuild = require('esbuild');
const { join, parse, resolve } = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const manifest = require('./contentful-app-manifest.json');

const argv = yargs(hideBin(process.argv)).argv;

const validateFunctions = () => {
  const requiredProperties = ['id', 'path', 'entryFile'];
  const uniqueValues = new Set();

  manifest.functions.forEach((contentfulFunction) => {
    requiredProperties.forEach((property) => {
      if (!contentfulFunction.hasOwnProperty(property)) {
        throw new Error(
          `Function with name: '${contentfulFunction.name}' is missing the '${property}' property`
        );
      }
    });

    const { id, path, entryFile } = contentfulFunction;

    if (uniqueValues.has(id)) {
      throw new Error(`Function id: '${id}'`);
    }
    if (uniqueValues.has(path)) {
      throw new Error(`Function path: '${path}'`);
    }
    if (uniqueValues.has(entryFile)) {
      throw new Error(`Duplicate function path: '${entryFile}'`);
    }

    uniqueValues.add(entryFile);
    uniqueValues.add(path);
    uniqueValues.add(id);
  });
};

const getEntryPoints = () => {
  return manifest.functions.reduce((result, contentfulFunction) => {
    const fileProperties = parse(contentfulFunction.path);
    const fileName = join(fileProperties.dir, fileProperties.name);

    result[fileName] = resolve(__dirname, contentfulFunction.entryFile);

    return result;
  }, {});
};

const main = async (watch = false) => {
  try {
    console.log('Building functions');
    validateFunctions();

    const config = {
      entryPoints: getEntryPoints(),
      bundle: true,
      minify: true,
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
    console.error('Error building functions');
    throw Error(e);
  }
};

main(argv._.includes('watch')).then(() => console.log('functions built successfully'));
