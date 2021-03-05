module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: [
    require.resolve('@contentful/eslint-config-extension/typescript'),
    require.resolve('@contentful/eslint-config-extension/jest'),
    require.resolve('@contentful/eslint-config-extension/jsx-a11y'),
    require.resolve('@contentful/eslint-config-extension/react')
  ]
};
