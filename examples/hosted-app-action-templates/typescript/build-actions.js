const esbuild = require('esbuild');
const { resolve } = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const manifest = require('./contentful-app-manifest.json');

const argv = yargs(hideBin(process.argv)).argv;

const getEntryPoints = () =>
  manifest.actions.reduce((result, action) => {
    result[action.id] = resolve(__dirname, action.path);
    return result;
  }, {});

const main = async (watch = false) => {
  try {
    const config = {
      entryPoints: getEntryPoints(),
      minify: true,
      bundle: true,
      platform: 'node',
      outdir: 'build/actions',
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
    console.log('App actions successfully built');
  } catch (e) {
    console.log('Error building app actions');
    throw Error(e);
  }
};

main(argv._.includes('watch')).then(() => console.log('actions built successfully'));
