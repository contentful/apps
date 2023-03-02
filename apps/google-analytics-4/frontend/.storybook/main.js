const webpack = require('webpack');

const injectVars = Object.keys(process.env).reduce((c, key) => {
  if (/^NEXT_PUBLIC_/.test(key)) {
    c[`process.env.${key}`] = JSON.stringify(process.env[key]);
  }
  return c;
}, {});

function injectEnv(definitions) {
  const env = 'process.env';

  if (!definitions[env]) {
    return {
      ...definitions,
      [env]: JSON.stringify(
        Object.fromEntries(
          Object.entries(definitions)
            .filter(([key]) => key.startsWith(env))
            .map(([key, value]) => [key.substring(env.length + 1), JSON.parse(value)])
        )
      ),
    };
  }
  return definitions;
}

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/preset-create-react-app',
    '@storybook/addon-a11y',
    'storybook-addon-designs',
    '@storybook/testing-react',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
  env: (config) => ({
    ...config,
    REACT_APP_BACKEND_API_URL: 'Mock Storybook environment variable',
    REACT_APP_RELEASE: 'Mock Storybook environment variable',
  }),
  webpackFinal: (config) => {
    config.plugins = config.plugins.reduce((c, plugin) => {
      if (plugin instanceof webpack.DefinePlugin) {
        return [
          ...c,
          new webpack.DefinePlugin(
            injectEnv({
              ...plugin.definitions,
              ...injectVars,
            })
          ),
        ];
      }

      return [...c, plugin];
    }, []);

    return config;
  },
  refs: {
    // 'contentful-design-system': {
    //   title: "Forma 36 Design Library",
    //   url: "https://f36-storybook.contentful.com"
    // },
    // 'experience-packages': {
    //   title: 'Experience Packages',
    //   url: 'https://5ccbc373887ca40020446347-yldsqjoxzb.chromatic.com',
    // },
    ' design-system': {
      title: 'Design System',
      url: 'https://5ccbc373887ca40020446347-yldsqjoxzb.chromatic.com',
    },
  },
};
