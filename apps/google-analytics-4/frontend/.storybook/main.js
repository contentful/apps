module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/preset-create-react-app',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
  env: (config) => ({
    ...config,
    REACT_APP_BACKEND_API_URL: 'An environment variable configured in Storybook',
  }),
  // env: (config) => ({
  //   ...config,
  //   REACT_APP_BACKEND_API_URL: process.env.REACT_APP_BACKEND_API_URL,
  // }),
  // webpackFinal: async config => {
  //   // find the DefinePlugin
  //   const plugin = config.plugins.find(plugin => plugin.definitions?.['process.env']);
  //   // add my env vars
  //   Object.keys(appConfig).forEach(key => {
  //     plugin.definitions['process.env'][key] = JSON.stringify(appConfig[key]);
  //   });
  // },
  // env: (config) => ({
  //   ...config,
  //   STORYBOOK_ENV: true,
  // }),
};
