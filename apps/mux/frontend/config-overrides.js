/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    util: require.resolve('util'),
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);
  config.ignoreWarnings = [/Failed to parse source map/];
  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: 'pre',
    loader: require.resolve('source-map-loader'),
    resolve: {
      fullySpecified: false,
    },
  });
  return config;
};
